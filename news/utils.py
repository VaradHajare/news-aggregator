import json
import logging
import os
import re
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# News API constants
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "fc8907db22cd47a0abeb63e50df7bf71")
BASE_URL = "https://newsapi.org/v2/"

# GNews API (free tier - 100 requests/day)
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "7c0d6463f07f0cedc51c83176610572c")
GNEWS_BASE_URL = "https://gnews.io/api/v4/"

DEFAULT_TIMEOUT = 10
DEFAULT_PAGE_SIZE = 12
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

TRUSTED_SOURCE_IDS = [
    "ars-technica",
    "techcrunch",
    "the-verge",
    "engadget",
    "techradar",
    "hacker-news",
    "the-hacker-news",
    "game-spot",
]

TECH_SOURCE_DOMAINS = [
    "arstechnica.com",
    "techcrunch.com",
    "theverge.com",
    "engadget.com",
    "techradar.com",
    "thehackernews.com",
    "cybernews.com",
    "gamespot.com",
    "bleepingcomputer.com",
    "venturebeat.com",
    "zdnet.com",
    "tomshardware.com",
]

TOPIC_KEYWORDS = [
    "artificial intelligence",
    "machine learning",
    "cybersecurity",
    "software engineering",
    "cloud computing",
    "networking",
    "data science",
    "devops",
    "platform engineering",
]

_session = requests.Session()
_session.headers.update(
    {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
    }
)

_summarizer = None
_summarizer_unavailable = False

CONTENT_HINT_RE = re.compile(
    r"(article|content|story|post|entry|main|body|text|copy|markdown)",
    re.IGNORECASE,
)
NOISE_HINT_RE = re.compile(
    r"(comment|promo|ad-|advert|share|social|footer|header|sidebar|nav|menu|related)",
    re.IGNORECASE,
)
BOILERPLATE_PATTERNS = [
    re.compile(r"^breaking news, reviews, opinion, top tech deals, and more\.?$", re.IGNORECASE),
    re.compile(r"^follow .* on google news.*preferred source.*$", re.IGNORECASE),
    re.compile(r"^make sure to click the follow button!?$", re.IGNORECASE),
    re.compile(r"^and of course, you can also follow .*?(youtube|tiktok|whatsapp).*$", re.IGNORECASE),
    re.compile(r"^you must confirm your public display name before commenting.*$", re.IGNORECASE),
    re.compile(r"^please logout and then login again.*display name.*$", re.IGNORECASE),
    re.compile(r"^➡️?\s*read our full guide to .*$", re.IGNORECASE),
    re.compile(r"^best overall: .*$", re.IGNORECASE),
    re.compile(r"^best budget .*$", re.IGNORECASE),
    re.compile(r"^best step-up .*$", re.IGNORECASE),
    re.compile(r"^[A-Z][a-z]+ [A-Z][a-z]+ is a freelance contributor.*$", re.IGNORECASE),
    re.compile(r"^beyond .*? bylines on sites including .*$", re.IGNORECASE),
    re.compile(r"^from \d{4} to \d{4} .*?(staff writer|deputy editor).*$", re.IGNORECASE),
    re.compile(r"^to get our expert news, reviews, and opinion in your feeds\.?$", re.IGNORECASE),
]
RELATED_ITEMS_RE = re.compile(r"(?:^|\s)1\s+[A-Z].*(?:\s+2\s+[A-Z].*)(?:\s+3\s+[A-Z].*)", re.IGNORECASE)
NUMBERED_RELATED_ITEM_RE = re.compile(r"^\s*\d+[\.\)]?\s+.+$")
PROMO_INLINE_RE = re.compile(
    r"(breaking news, reviews, opinion, top tech deals, and more\.?\s*|"
    r"make sure to click the follow button!?\s*|"
    r"follow .*? on google news.*?(?:feeds|source).*?(?:[.!?]|$)\s*|"
    r"and of course, you can also follow .*?(?:youtube|tiktok|whatsapp).*?(?:[.!?]|$)\s*)",
    re.IGNORECASE,
)
MEDIA_MARKER_RE = re.compile(r"\[Media:\s*https?://[^\]]+\]", re.IGNORECASE)
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])")
SUMMARY_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "how",
    "in", "into", "is", "it", "its", "of", "on", "or", "that", "the", "their",
    "this", "to", "was", "were", "what", "when", "where", "which", "who", "why",
    "will", "with", "your",
}


def _safe_json_request(url: str, params: dict[str, Any]) -> dict[str, Any]:
    try:
        response = _session.get(url, params=params, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        logger.warning("Request failed for %s: %s", url, exc)
    except ValueError as exc:
        logger.warning("Invalid JSON response from %s: %s", url, exc)
    return {}


def _merge_unique_articles(*article_groups, limit=20):
    merged = []
    existing_urls = set()

    for group in article_groups:
        for article in group:
            article_url = article.get("url")
            if article_url and article_url not in existing_urls:
                merged.append(article)
                existing_urls.add(article_url)
                if len(merged) >= limit:
                    return merged

    return merged


def _append_unique_articles(
    merged: list[dict[str, Any]],
    existing_urls: set[str],
    articles: list[dict[str, Any]],
    limit: int | None = None,
) -> bool:
    for article in articles:
        article_url = article.get("url")
        if article_url and article_url not in existing_urls:
            merged.append(article)
            existing_urls.add(article_url)
            if limit and len(merged) >= limit:
                return True
    return False


def _normalize_gnews_article(article: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": article.get("title"),
        "description": article.get("description"),
        "url": article.get("url"),
        "urlToImage": article.get("image"),
        "source": {"name": article.get("source", {}).get("name", "Unknown")},
        "publishedAt": article.get("publishedAt"),
        "author": None,
    }


def _query_terms(query: str) -> list[str]:
    terms = []
    seen = set()
    for token in re.findall(r"[a-z0-9][a-z0-9\-/+.]*", str(query or "").lower()):
        if len(token) < 3 or token in SUMMARY_STOPWORDS:
            continue
        if token not in seen:
            seen.add(token)
            terms.append(token)
    return terms


def _score_relevance(text: str, query: str, query_terms: list[str] | None = None) -> float:
    haystack = _clean_text(text).lower()
    if not haystack:
        return 0.0

    terms = query_terms if query_terms is not None else _query_terms(query)
    if not terms:
        return 1.0

    score = 0.0
    exact_query = _clean_text(query).lower()
    if exact_query and exact_query in haystack:
        score += 6.0

    matches = 0
    for term in terms:
        if term in haystack:
            matches += 1
            score += 2.5

    if matches:
        score += matches / max(len(terms), 1)

    return score


def _rank_articles_for_query(articles: list[dict[str, Any]], query: str) -> list[dict[str, Any]]:
    query_terms = _query_terms(query)

    def article_score(article: dict[str, Any]) -> tuple[float, int]:
        title = article.get("title") or ""
        description = article.get("description") or ""
        source_name = article.get("source", {}).get("name", "") if isinstance(article.get("source"), dict) else ""

        score = (
            _score_relevance(title, query, query_terms) * 3.5
            + _score_relevance(description, query, query_terms) * 1.8
            + _score_relevance(source_name, query, query_terms) * 0.4
        )
        return (score, len(_clean_text(description)))

    return sorted(articles, key=article_score, reverse=True)


def _normalize_sentence_key(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", _clean_text(text).lower())


def _collect_relevant_sentences(text: str, query: str, max_sentences: int = 2) -> list[str]:
    cleaned_text = _clean_article_text(text)
    query_terms = _query_terms(query)
    raw_sentences = re.split(SENTENCE_SPLIT_RE, cleaned_text)
    candidates = []

    for index, sentence in enumerate(raw_sentences):
        candidate = _clean_text(sentence)
        if len(candidate.split()) < 8:
            continue
        if len(candidate.split()) > 45:
            continue
        if _is_boilerplate_block(candidate):
            continue

        score = _score_relevance(candidate, query, query_terms)
        if score <= 0 and index > 1:
            continue

        score += max(0, 2 - min(index, 2)) * 0.35
        if re.search(r"\d", candidate):
            score += 0.25

        candidates.append((score, index, candidate))

    if not candidates:
        fallback = []
        for sentence in raw_sentences:
            candidate = _clean_text(sentence)
            if len(candidate.split()) >= 8 and not _is_boilerplate_block(candidate):
                fallback.append(candidate)
            if len(fallback) >= max_sentences:
                break
        return fallback

    selected = []
    seen = set()
    for _, index, candidate in sorted(candidates, key=lambda item: (-item[0], item[1])):
        key = _normalize_sentence_key(candidate)
        if not key or key in seen:
            continue
        seen.add(key)
        selected.append((index, candidate))
        if len(selected) >= max_sentences:
            break

    return [candidate for _, candidate in sorted(selected, key=lambda item: item[0])]


def _build_query_summary(query: str, source_entries: list[dict[str, Any]], max_sentences: int = 5) -> str:
    ranked_candidates = []
    query_terms = _query_terms(query)

    for source in source_entries:
        for order, sentence in enumerate(source.get("sentences", [])):
            score = _score_relevance(sentence, query, query_terms)
            score += max(0, 1 - order) * 0.3
            ranked_candidates.append(
                {
                    "score": score,
                    "order": order,
                    "source_num": source["num"],
                    "text": sentence,
                }
            )

    if not ranked_candidates:
        return ""

    chosen = []
    used_keys = set()
    used_sources = set()

    for candidate in sorted(ranked_candidates, key=lambda item: (-item["score"], item["source_num"], item["order"])):
        key = _normalize_sentence_key(candidate["text"])
        if not key or key in used_keys:
            continue
        if candidate["source_num"] in used_sources and len(used_sources) < len(source_entries):
            continue
        chosen.append(candidate)
        used_keys.add(key)
        used_sources.add(candidate["source_num"])
        if len(chosen) >= max_sentences:
            break

    if len(chosen) < min(max_sentences, len(ranked_candidates)):
        for candidate in sorted(ranked_candidates, key=lambda item: (-item["score"], item["source_num"], item["order"])):
            key = _normalize_sentence_key(candidate["text"])
            if not key or key in used_keys:
                continue
            chosen.append(candidate)
            used_keys.add(key)
            if len(chosen) >= max_sentences:
                break

    return " ".join(f"{item['text']} [{item['source_num']}]" for item in chosen).strip()


def get_latest_news(page: int = 1, page_size: int = DEFAULT_PAGE_SIZE):
    """Fetch AI and engineering-focused news from curated sources and topics."""
    page = max(1, int(page))
    page_size = max(1, int(page_size))
    topic_query = " OR ".join(f'"{keyword}"' for keyword in TOPIC_KEYWORDS)
    start = (page - 1) * page_size
    target_count = start + page_size
    merged = []
    existing_urls: set[str] = set()

    for fetch_page in range(1, page + 1):
        source_articles = _safe_json_request(
            f"{BASE_URL}top-headlines",
            {
                "sources": ",".join(TRUSTED_SOURCE_IDS),
                "apiKey": NEWS_API_KEY,
                "pageSize": page_size,
                "page": fetch_page,
            },
        ).get("articles", [])

        topic_articles = _safe_json_request(
            f"{BASE_URL}everything",
            {
                "q": topic_query,
                "sortBy": "publishedAt",
                "language": "en",
                "domains": ",".join(TECH_SOURCE_DOMAINS),
                "apiKey": NEWS_API_KEY,
                "pageSize": page_size,
                "page": fetch_page,
            },
        ).get("articles", [])

        gnews_data = _safe_json_request(
            f"{GNEWS_BASE_URL}search",
            {
                "q": topic_query,
                "lang": "en",
                "max": page_size,
                "page": fetch_page,
                "apikey": GNEWS_API_KEY,
            },
        )
        gnews_articles = [_normalize_gnews_article(article) for article in gnews_data.get("articles", [])]

        reached_limit = any(
            [
                _append_unique_articles(merged, existing_urls, source_articles, target_count),
                _append_unique_articles(merged, existing_urls, topic_articles, target_count),
                _append_unique_articles(merged, existing_urls, gnews_articles, target_count),
            ]
        )
        if reached_limit:
            break

    return merged[start:target_count]


def search_news(query, page: int = 1, page_size: int = DEFAULT_PAGE_SIZE):
    """Search news from multiple sources and normalize the result set."""
    page = max(1, int(page))
    page_size = max(1, int(page_size))
    start = (page - 1) * page_size
    target_count = start + page_size
    all_articles = []
    existing_urls: set[str] = set()

    for fetch_page in range(1, page + 1):
        newsapi_data = _safe_json_request(
            f"{BASE_URL}everything",
            {
                "q": query,
                "sortBy": "relevancy",
                "domains": ",".join(TECH_SOURCE_DOMAINS),
                "apiKey": NEWS_API_KEY,
                "pageSize": page_size,
                "page": fetch_page,
                "language": "en",
            },
        )
        newsapi_articles = newsapi_data.get("articles", [])

        gnews_data = _safe_json_request(
            f"{GNEWS_BASE_URL}search",
            {
                "q": query,
                "lang": "en",
                "max": page_size,
                "page": fetch_page,
                "apikey": GNEWS_API_KEY,
            },
        )
        gnews_articles = [_normalize_gnews_article(article) for article in gnews_data.get("articles", [])]

        reached_limit = any(
            [
                _append_unique_articles(all_articles, existing_urls, newsapi_articles, target_count),
                _append_unique_articles(all_articles, existing_urls, gnews_articles, target_count),
            ]
        )
        if reached_limit:
            break

    return all_articles[start:target_count]


def _clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\b(Advertisement|Sponsored|Sign up for .*?)\b", "", text, flags=re.IGNORECASE)
    return re.sub(r"\s{2,}", " ", text).strip()


def _is_boilerplate_block(text: str) -> bool:
    cleaned = _clean_text(text)
    if not cleaned:
        return True
    if RELATED_ITEMS_RE.search(cleaned):
        return True
    return any(pattern.match(cleaned) for pattern in BOILERPLATE_PATTERNS)


def _remove_boilerplate_sentences(text: str) -> str:
    cleaned = _clean_text(text)
    if not cleaned:
        return ""
    if _is_boilerplate_block(cleaned):
        return ""

    cleaned = PROMO_INLINE_RE.sub("", cleaned)
    cleaned = MEDIA_MARKER_RE.sub("", cleaned)
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", cleaned)
    kept_sentences = []
    for sentence in sentences:
        candidate = _clean_text(sentence)
        if not candidate or _is_boilerplate_block(candidate):
            continue
        kept_sentences.append(candidate)
    return " ".join(kept_sentences).strip()


def _is_numbered_related_line(text: str) -> bool:
    cleaned = _clean_text(text)
    if not cleaned or not NUMBERED_RELATED_ITEM_RE.match(cleaned):
        return False

    headline = re.sub(r"^\s*\d+[\.\)]?\s+", "", cleaned).strip()
    if len(headline) < 35 or len(headline) > 220:
        return False

    return not headline.endswith((".", "!", "?"))


def _strip_numbered_related_blocks(text: str) -> str:
    lines = str(text or "").split("\n")
    kept_lines = []
    index = 0

    while index < len(lines):
        current = lines[index]
        if not _is_numbered_related_line(current):
            kept_lines.append(current)
            index += 1
            continue

        run_start = index
        run_items = []
        while index < len(lines):
            line = lines[index]
            if not line.strip():
                index += 1
                continue
            if _is_numbered_related_line(line):
                run_items.append(line)
                index += 1
                continue
            break

        if len(run_items) >= 3:
            while kept_lines and not kept_lines[-1].strip():
                kept_lines.pop()
            continue

        kept_lines.extend(lines[run_start:index])

    return "\n".join(kept_lines)


def _clean_article_text(text: str) -> str:
    normalized = _strip_numbered_related_blocks(str(text or "").replace("\r", "\n"))
    blocks = re.split(r"\n{2,}", normalized)
    cleaned_blocks = []
    for block in blocks:
        candidate = _remove_boilerplate_sentences(block)
        if not candidate:
            continue
        cleaned_blocks.append(candidate)

    if not cleaned_blocks:
        fallback = _remove_boilerplate_sentences(normalized)
        return fallback.strip()

    return "\n\n".join(cleaned_blocks).strip()


def _iter_json_ld_payloads(soup: BeautifulSoup):
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text()
        if not raw:
            continue
        try:
            payload = json.loads(raw.strip())
        except json.JSONDecodeError:
            continue

        if isinstance(payload, list):
            for item in payload:
                if isinstance(item, dict):
                    yield item
        elif isinstance(payload, dict):
            if isinstance(payload.get("@graph"), list):
                for item in payload["@graph"]:
                    if isinstance(item, dict):
                        yield item
            yield payload


def _extract_from_json_ld(soup: BeautifulSoup) -> str | None:
    for item in _iter_json_ld_payloads(soup):
        article_body = item.get("articleBody")
        if isinstance(article_body, str):
            cleaned = _clean_article_text(article_body)
            if len(cleaned.split()) >= 80:
                return cleaned
    return None


def _normalize_image_url(image_url: str | None, base_url: str) -> str | None:
    if not image_url:
        return None
    normalized = urljoin(base_url, image_url.strip())
    if normalized.startswith("http://") or normalized.startswith("https://"):
        return normalized
    return None


def _extract_image_from_json_ld(soup: BeautifulSoup, base_url: str) -> str | None:
    for item in _iter_json_ld_payloads(soup):
        image = item.get("image")
        if isinstance(image, str):
            normalized = _normalize_image_url(image, base_url)
            if normalized:
                return normalized
        if isinstance(image, list):
            for candidate in image:
                if isinstance(candidate, str):
                    normalized = _normalize_image_url(candidate, base_url)
                    if normalized:
                        return normalized
                elif isinstance(candidate, dict):
                    normalized = _normalize_image_url(candidate.get("url"), base_url)
                    if normalized:
                        return normalized
        if isinstance(image, dict):
            normalized = _normalize_image_url(image.get("url"), base_url)
            if normalized:
                return normalized
    return None


def _extract_main_image(soup: BeautifulSoup, base_url: str) -> str | None:
    meta_candidates = [
        ("meta", {"property": "og:image"}),
        ("meta", {"name": "twitter:image"}),
        ("meta", {"property": "twitter:image"}),
        ("meta", {"itemprop": "image"}),
    ]

    for tag_name, attrs in meta_candidates:
        tag = soup.find(tag_name, attrs=attrs)
        if not tag:
            continue
        normalized = _normalize_image_url(tag.get("content"), base_url)
        if normalized:
            return normalized

    json_ld_image = _extract_image_from_json_ld(soup, base_url)
    if json_ld_image:
        return json_ld_image

    article_node = soup.find("article") or soup.find("main")
    if article_node:
        img = article_node.find("img")
        if img:
            normalized = _normalize_image_url(img.get("src"), base_url)
            if normalized:
                return normalized

    for img in soup.find_all("img"):
        normalized = _normalize_image_url(img.get("src"), base_url)
        if normalized:
            return normalized
    return None


def _score_block(node) -> int:
    text = _clean_text(" ".join(part.get_text(" ", strip=True) for part in node.find_all(["p", "li"])))
    if not text:
        return 0

    text_len = len(text)
    paragraph_count = len(node.find_all("p"))
    class_id_text = " ".join(
        filter(
            None,
            [
                " ".join(node.get("class", [])),
                node.get("id", ""),
            ],
        )
    )
    hint_bonus = 600 if CONTENT_HINT_RE.search(class_id_text) else 0
    noise_penalty = 800 if NOISE_HINT_RE.search(class_id_text) else 0
    return text_len + (paragraph_count * 120) + hint_bonus - noise_penalty


def _extract_candidate_text(node) -> str:
    paragraphs = []
    for tag in node.find_all(["h2", "h3", "p", "li"]):
        text = _clean_article_text(tag.get_text(" ", strip=True))
        if len(text) >= 40:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def _extract_main_content(soup: BeautifulSoup) -> str | None:
    for tag in soup(["script", "style", "noscript", "iframe", "header", "footer", "nav", "aside", "form"]):
        tag.decompose()

    candidates = []
    main_node = soup.find("article") or soup.find("main")
    if main_node:
        candidates.append(main_node)

    candidates.extend(
        soup.find_all(
            ["section", "div"],
            attrs={
                "class": CONTENT_HINT_RE,
            },
        )
    )
    candidates.extend(
        soup.find_all(
            ["section", "div"],
            attrs={
                "id": CONTENT_HINT_RE,
            },
        )
    )

    best_text = ""
    best_score = 0
    seen = set()
    for candidate in candidates:
        candidate_id = id(candidate)
        if candidate_id in seen:
            continue
        seen.add(candidate_id)
        score = _score_block(candidate)
        if score <= best_score:
            continue
        extracted = _extract_candidate_text(candidate)
        if len(extracted.split()) >= 80:
            best_score = score
            best_text = extracted

    if best_text:
        return best_text

    paragraphs = []
    for paragraph in soup.find_all("p"):
        text = _clean_article_text(paragraph.get_text(" ", strip=True))
        if len(text) >= 40:
            paragraphs.append(text)
    fallback = "\n\n".join(paragraphs)
    return fallback if len(fallback.split()) >= 80 else None


def fetch_article_data(url: str) -> dict[str, str] | None:
    """Extract article text and main image using HTML parsing."""
    try:
        response = _session.get(url, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Error downloading article %s: %s", url, exc)
        return None

    content_type = response.headers.get("Content-Type", "")
    if "html" not in content_type and "<html" not in response.text[:500].lower():
        return None

    soup = BeautifulSoup(response.text, "lxml")

    image_url = _extract_main_image(soup, url)
    text = _extract_from_json_ld(soup) or _extract_main_content(soup)
    if not text:
        return None

    cleaned = _clean_article_text(text)
    if len(cleaned.split()) < 50:
        return None

    return {
        "text": cleaned,
        "image_url": image_url or "",
    }


def fetch_article(url):
    article_data = fetch_article_data(url)
    return article_data["text"] if article_data else None


def _get_summarizer():
    global _summarizer, _summarizer_unavailable

    if _summarizer is not None:
        return _summarizer
    if _summarizer_unavailable:
        return None

    try:
        from transformers import pipeline

        _summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
    except Exception as exc:
        _summarizer_unavailable = True
        logger.warning("Summarizer unavailable, using fallback summary: %s", exc)
        return None

    return _summarizer


def _fallback_summary(text: str, sentence_limit: int = 3) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", _clean_text(text))
    picked = []
    for sentence in sentences:
        if len(sentence.split()) >= 8:
            picked.append(sentence)
        if len(picked) >= sentence_limit:
            break

    if picked:
        return " ".join(picked)

    words = text.split()
    return " ".join(words[:120]) + ("..." if len(words) > 120 else "")


def summarize_text(text):
    max_words = 1024
    truncated_text = " ".join(text.split()[:max_words])
    summarizer = _get_summarizer()
    if not summarizer:
        return _fallback_summary(truncated_text)

    try:
        summary = summarizer(
            truncated_text,
            max_length=250,
            min_length=100,
            do_sample=False,
            truncation=True,
        )
        return summary[0]["summary_text"]
    except Exception as exc:
        logger.warning("Summarizer failed, using fallback summary: %s", exc)
        return _fallback_summary(truncated_text)


def get_summarized_news(url):
    text = fetch_article(url)
    if not text or len(text.split()) < 50:
        return "Sorry, the article text is too short or could not be extracted."
    return summarize_text(text)


def get_multi_source_summary(query, max_sources=5):
    """
    Fetch multiple articles on a topic and generate a query-aware
    extractive summary with inline citations [1], [2], etc.
    """
    articles = _rank_articles_for_query(search_news(query), query)
    if not articles:
        return {
            "summary": "No articles found for this topic.",
            "sources": [],
        }

    sources = []
    source_entries = []

    for article in articles[: max(max_sources * 2, 6)]:
        url = article.get("url")
        title = article.get("title", "Unknown Title")
        source_name = article.get("source", {}).get("name", "Unknown Source")
        citation_num = len(sources) + 1

        text = fetch_article(url) if url else None
        description = article.get("description") or ""
        relevant_sentences = []

        if text and len(text.split()) > 50:
            relevant_sentences = _collect_relevant_sentences(text, query, max_sentences=2)

        if not relevant_sentences and description:
            relevant_sentences = _collect_relevant_sentences(description, query, max_sentences=1)

        if not relevant_sentences:
            continue

        source_record = {
            "num": citation_num,
            "title": title,
            "source": source_name,
            "url": url,
        }
        sources.append(source_record)
        source_entries.append(
            {
                **source_record,
                "sentences": relevant_sentences,
            }
        )

        if len(sources) >= max_sources:
            break

    if not source_entries:
        return {
            "summary": "Could not find relevant source content for this topic.",
            "sources": sources,
        }

    summary_with_citations = _build_query_summary(query, source_entries, max_sentences=min(5, len(source_entries) + 1))

    if not summary_with_citations:
        fallback_summary = []
        for source in source_entries[:3]:
            fallback_summary.extend(f"{sentence} [{source['num']}]" for sentence in source["sentences"][:1])
        summary_with_citations = " ".join(fallback_summary).strip()

    return {
        "summary": summary_with_citations,
        "sources": sources,
    }
