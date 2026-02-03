/**
 * PlaywrightClient - HTTP client for Playwright Server
 */
export class PlaywrightClient {
    baseUrl;
    constructor(baseUrl = 'http://localhost:3102') {
        this.baseUrl = baseUrl;
    }
    async request(method, path, body) {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }
        return response.json();
    }
    // Page Management
    async createPage(name, description, url) {
        return this.request('POST', '/api/pages', { name, description, url });
    }
    async listPages() {
        return this.request('GET', '/api/pages');
    }
    async closePage(pageId) {
        await this.request('DELETE', `/api/pages/${pageId}`);
    }
    // Navigation
    async navigate(pageId, url) {
        return this.request('POST', `/api/pages/${pageId}/navigate`, { url });
    }
    // Actions using ref
    async click(pageId, ref, element) {
        return this.request('POST', `/api/pages/${pageId}/click`, {
            ref,
            element: element || `Element with ref=${ref}`
        });
    }
    async type(pageId, ref, text, element) {
        return this.request('POST', `/api/pages/${pageId}/type`, {
            ref,
            text,
            element: element || `Element with ref=${ref}`
        });
    }
    async fill(pageId, ref, value, element) {
        return this.request('POST', `/api/pages/${pageId}/fill`, {
            ref,
            value,
            element: element || `Element with ref=${ref}`
        });
    }
    async select(pageId, ref, value, element) {
        return this.request('POST', `/api/pages/${pageId}/select`, {
            ref,
            value,
            element: element || `Element with ref=${ref}`
        });
    }
    // Screenshot
    async screenshot(pageId, fullPage = true) {
        const result = await this.request('POST', `/api/pages/${pageId}/screenshot`, { fullPage });
        return result.screenshot;
    }
    // Browser Actions - Additional
    async browserHover(pageId, ref, element) {
        return this.request('POST', `/api/pages/${pageId}/hover`, {
            ref,
            element: element || `Element with ref=${ref}`
        });
    }
    async browserPressKey(pageId, key) {
        return this.request('POST', `/api/pages/${pageId}/press`, { key });
    }
    async browserFileUpload(pageId, ref, files) {
        return this.request('POST', `/api/pages/${pageId}/upload`, { ref, files });
    }
    async browserHandleDialog(pageId, accept, text) {
        return this.request('POST', `/api/pages/${pageId}/dialog`, { accept, text });
    }
    async browserNavigateBack(pageId) {
        return this.request('POST', `/api/pages/${pageId}/back`);
    }
    async browserNavigateForward(pageId) {
        return this.request('POST', `/api/pages/${pageId}/forward`);
    }
    async scrollToBottom(pageId, ref) {
        return this.request('POST', `/api/pages/${pageId}/scroll-bottom`, { ref });
    }
    async scrollToTop(pageId, ref) {
        return this.request('POST', `/api/pages/${pageId}/scroll-top`, { ref });
    }
    async waitForTimeout(pageId, timeout) {
        return this.request('POST', `/api/pages/${pageId}/wait-timeout`, { timeout });
    }
    async waitForSelector(pageId, selector, options) {
        return this.request('POST', `/api/pages/${pageId}/wait-selector`, { selector, options });
    }
    // Aliases for compatibility
    async browserClick(pageId, ref, element) {
        return this.click(pageId, ref, element);
    }
    async browserType(pageId, ref, text, element) {
        return this.type(pageId, ref, text, element);
    }
    async browserSelectOption(pageId, ref, value, element) {
        return this.select(pageId, ref, value, element);
    }
    async browserNavigate(pageId, url) {
        return this.navigate(pageId, url);
    }
    // Get page outline - structured summary with intelligent folding (fixed 200 lines)
    async getOutline(pageId) {
        const result = await this.request('POST', `/api/pages/${pageId}/outline`);
        return result.outline;
    }
    // Search snapshot - search snapshot content with regular expressions
    async searchSnapshot(pageId, pattern, options) {
        const searchOptions = {
            pattern,
            ignoreCase: options?.ignoreCase || false,
            lineLimit: options?.lineLimit || 100
        };
        return this.request('POST', `/api/pages/${pageId}/search`, searchOptions);
    }
}
// Export for CommonJS compatibility
export default PlaywrightClient;
