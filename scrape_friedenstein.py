from playwright.sync_api import sync_playwright
import sys

def scrape(url="https://friedenstein.app/"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)
        # Wait a bit extra for any JS rendering
        page.wait_for_timeout(3000)

        title = page.title()
        print(f"=== Title: {title} ===\n")

        # Get the full text content
        text = page.inner_text("body")
        print("=== Page Text ===")
        print(text[:10000])
        print("\n=== All Links ===")
        links = page.eval_on_selector_all("a[href]", "els => els.map(e => ({text: e.innerText.trim(), href: e.href}))")
        for link in links[:100]:
            if link["text"] or link["href"]:
                print(f"  {link['text'][:80]:80s} -> {link['href']}")

        print("\n=== Network API calls observed ===")
        # Re-navigate to capture network requests
        api_urls = []
        def on_request(request):
            url = request.url
            if "/api/" in url or "graphql" in url or ".json" in url:
                api_urls.append(url)
        page.on("request", on_request)
        page.reload(wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        for u in api_urls[:50]:
            print(f"  {u}")

        browser.close()

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://friedenstein.app/"
    scrape(url)
