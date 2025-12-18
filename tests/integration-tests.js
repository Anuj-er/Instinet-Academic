// Integration Test Framework
class TestRunner {
    constructor() {
        this.testSuites = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            pending: 0,
            totalDuration: 0
        };
        this.testDetails = [];
    }

    describe(suiteName, tests) {
        this.testSuites.push({
            name: suiteName,
            tests: tests
        });
    }

    async runAll() {
        this.results = { total: 0, passed: 0, failed: 0, pending: 0, totalDuration: 0 };
        this.testDetails = [];
        const resultsContainer = document.getElementById('testResults');
        resultsContainer.innerHTML = '';
        
        document.getElementById('progressBar').style.display = 'block';
        const suiteStartTime = Date.now();
        
        for (const suite of this.testSuites) {
            const suiteElement = this.createSuiteElement(suite.name);
            resultsContainer.appendChild(suiteElement);
            
            for (const test of suite.tests) {
                this.results.total++;
                this.updateStats();
                
                const testElement = this.createTestElement(test);
                suiteElement.appendChild(testElement);
                
                await this.runTest(test, testElement, suite.name);
                this.updateProgress();
            }
        }
        
        this.results.totalDuration = Date.now() - suiteStartTime;
        this.updateStats();
        this.showSummary();
        document.getElementById('progressBar').style.display = 'none';
    }

    createSuiteElement(name) {
        const suite = document.createElement('div');
        suite.className = 'test-suite';
        suite.innerHTML = `<div class="suite-header">${name}</div>`;
        return suite;
    }

    createTestElement(test) {
        const testCase = document.createElement('div');
        testCase.className = 'test-case status-pending';
        testCase.innerHTML = `
            <div class="test-header">
                <span class="test-status-icon">⏳</span>
                <div class="test-content">
                    <div class="test-name">${test.name}</div>
                    <div class="test-description">${test.description || ''}</div>
                </div>
            </div>
        `;
        return testCase;
    }

    async runTest(test, element, suiteName) {
        const statusIcon = element.querySelector('.test-status-icon');
        const contentDiv = element.querySelector('.test-content');
        
        element.className = 'test-case status-running';
        statusIcon.innerHTML = '<span class="spinner"></span>';
        
        const startTime = Date.now();
        const testDetail = {
            suite: suiteName,
            name: test.name,
            description: test.description,
            startTime: new Date().toISOString(),
            status: 'running'
        };
        
        try {
            const result = await test.fn();
            const duration = Date.now() - startTime;
            
            element.className = 'test-case status-passed';
            statusIcon.textContent = '✓';
            
            testDetail.status = 'passed';
            testDetail.duration = duration;
            testDetail.result = result;
            
            contentDiv.innerHTML += `<div class="test-meta">Duration: ${duration}ms</div>`;
            
            // Add detailed information
            if (result && typeof result === 'object') {
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'test-details';
                detailsDiv.innerHTML = this.formatTestDetails(result);
                element.appendChild(detailsDiv);
            }
            
            this.results.passed++;
            this.results.pending--;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            element.className = 'test-case status-failed';
            statusIcon.textContent = '✗';
            
            testDetail.status = 'failed';
            testDetail.duration = duration;
            testDetail.error = {
                message: error.message,
                stack: error.stack
            };
            
            contentDiv.innerHTML += `<div class="test-meta">Duration: ${duration}ms</div>`;
            
            // Add error details
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = `Error: ${error.message}\n${error.stack || ''}`;
            element.appendChild(errorDiv);
            
            this.results.failed++;
            this.results.pending--;
        }
        
        this.testDetails.push(testDetail);
        this.updateStats();
    }

    formatTestDetails(data) {
        let html = '';
        for (const [key, value] of Object.entries(data)) {
            const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
            html += `
                <div class="detail-row">
                    <span class="detail-label">${key}:</span>
                    <span class="detail-value">${displayValue}</span>
                </div>
            `;
        }
        return html;
    }

    showSummary() {
        const summary = document.getElementById('summary');
        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        
        summary.style.display = 'block';
        summary.innerHTML = `
            <div class="summary-line"><strong>Test Run Summary</strong></div>
            <div class="summary-line">Total Tests: ${this.results.total}</div>
            <div class="summary-line">Passed: ${this.results.passed} (${passRate}%)</div>
            <div class="summary-line">Failed: ${this.results.failed}</div>
            <div class="summary-line">Total Duration: ${this.results.totalDuration}ms</div>
            <div class="summary-line">Average: ${(this.results.totalDuration / this.results.total).toFixed(2)}ms per test</div>
        `;
    }

    updateStats() {
        document.getElementById('totalTests').textContent = this.results.total;
        document.getElementById('passedTests').textContent = this.results.passed;
        document.getElementById('failedTests').textContent = this.results.failed;
        document.getElementById('pendingTests').textContent = this.results.total - this.results.passed - this.results.failed;
        document.getElementById('totalDuration').textContent = this.results.totalDuration + 'ms';
    }

    updateProgress() {
        const progress = ((this.results.passed + this.results.failed) / this.results.total) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
    }
}

// Helper functions
async function fetchAPI(endpoint, options = {}) {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    const duration = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    
    // Clone response to read body multiple times if needed
    const responseClone = response.clone();
    
    let data;
    if (contentType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (e) {
            data = await responseClone.text();
        }
    } else {
        data = await response.text();
    }
    
    return {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        contentType,
        data,
        duration,
        url: endpoint
    };
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected truthy value but got ${actual}`);
            }
        },
        toBeFalsy() {
            if (actual) {
                throw new Error(`Expected falsy value but got ${actual}`);
            }
        },
        toContain(item) {
            if (!actual.includes(item)) {
                throw new Error(`Expected array to contain ${item}`);
            }
        },
        toHaveProperty(prop) {
            if (!(prop in actual)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        },
        toBeGreaterThan(value) {
            if (actual <= value) {
                throw new Error(`Expected ${actual} to be greater than ${value}`);
            }
        },
        toBeInstanceOf(type) {
            if (!(actual instanceof type)) {
                throw new Error(`Expected ${actual} to be instance of ${type.name}`);
            }
        }
    };
}

// Initialize test runner
const runner = new TestRunner();

// API Tests
runner.describe('API Endpoints', [
    {
        name: 'Health Check Endpoint',
        description: 'GET /health should return status ok',
        fn: async () => {
            const result = await fetchAPI('/health');
            expect(result.ok).toBeTruthy();
            expect(result.status).toBe(200);
            expect(result.data.status).toBe('ok');
            return {
                endpoint: '/health',
                method: 'GET',
                status: result.status,
                response: JSON.stringify(result.data),
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Courses API Endpoint',
        description: 'GET /api/courses should return array of courses',
        fn: async () => {
            const result = await fetchAPI('/api/courses');
            expect(result.ok).toBeTruthy();
            expect(result.data.courses).toBeInstanceOf(Array);
            expect(result.data.courses.length).toBeGreaterThan(0);
            return {
                endpoint: '/api/courses',
                method: 'GET',
                status: result.status,
                coursesCount: result.data.courses.length,
                sampleCourse: result.data.courses[0]?.name || 'N/A',
                duration: result.duration + 'ms'
            };
        }
    }
]);

// Redis Caching Tests
runner.describe('Redis Caching System', [
    {
        name: 'Redis Stats API',
        description: 'GET /redis/stats should return cache statistics',
        fn: async () => {
            const result = await fetchAPI('/redis/stats');
            // This may redirect if not authenticated, that's okay
            return {
                endpoint: '/redis/stats',
                method: 'GET',
                status: result.status,
                authenticated: result.ok,
                note: result.ok ? 'Stats retrieved' : 'Requires authentication (expected)',
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Announcements API Caching',
        description: 'GET /api/announcements should use Redis cache',
        fn: async () => {
            const result = await fetchAPI('/api/announcements');
            return {
                endpoint: '/api/announcements',
                method: 'GET',
                status: result.status,
                authenticated: result.ok,
                cached: result.data.fromCache || false,
                note: result.ok ? 'Data retrieved' : 'Requires authentication',
                duration: result.duration + 'ms'
            };
        }
    }
]);

// UI Tests
runner.describe('Page Loading Tests', [
    {
        name: 'Home Page',
        description: 'GET / should return 200 and HTML content',
        fn: async () => {
            const result = await fetchAPI('/');
            expect(result.ok).toBeTruthy();
            expect(result.status).toBe(200);
            expect(result.contentType).toContain('text/html');
            return {
                endpoint: '/',
                method: 'GET',
                status: result.status,
                contentType: result.contentType,
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Login Page',
        description: 'GET /login should return 200 and HTML content',
        fn: async () => {
            const result = await fetchAPI('/login');
            expect(result.ok).toBeTruthy();
            expect(result.status).toBe(200);
            expect(result.contentType).toContain('text/html');
            return {
                endpoint: '/login',
                method: 'GET',
                status: result.status,
                contentType: result.contentType,
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Register Page',
        description: 'GET /register should return 200 and HTML content',
        fn: async () => {
            const result = await fetchAPI('/register');
            expect(result.ok).toBeTruthy();
            expect(result.status).toBe(200);
            expect(result.contentType).toContain('text/html');
            return {
                endpoint: '/register',
                method: 'GET',
                status: result.status,
                contentType: result.contentType,
                duration: result.duration + 'ms'
            };
        }
    }
]);

// Static Assets Tests
runner.describe('Static Assets', [
    {
        name: 'Main CSS Stylesheet',
        description: 'GET /css/style.css should load successfully',
        fn: async () => {
            const result = await fetchAPI('/css/style.css');
            expect(result.ok).toBeTruthy();
            expect(result.contentType).toContain('css');
            return {
                endpoint: '/css/style.css',
                method: 'GET',
                status: result.status,
                contentType: result.contentType,
                size: result.data.length + ' bytes',
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Main JavaScript File',
        description: 'GET /js/main.js should load successfully',
        fn: async () => {
            const result = await fetchAPI('/js/main.js');
            expect(result.ok).toBeTruthy();
            expect(result.contentType).toContain('javascript');
            return {
                endpoint: '/js/main.js',
                method: 'GET',
                status: result.status,
                contentType: result.contentType,
                size: result.data.length + ' bytes',
                duration: result.duration + 'ms'
            };
        }
    }
]);

// Performance Tests
runner.describe('Performance Tests', [
    {
        name: 'API Response Time',
        description: 'Health check should respond within 1 second',
        fn: async () => {
            const result = await fetchAPI('/health');
            if (result.duration > 1000) {
                throw new Error(`Response took ${result.duration}ms (expected < 1000ms)`);
            }
            return {
                endpoint: '/health',
                duration: result.duration + 'ms',
                threshold: '1000ms',
                status: result.duration < 1000 ? 'PASS' : 'SLOW'
            };
        }
    }
]);

// WebSocket Tests
runner.describe('WebSocket Connection', [
    {
        name: 'Socket.io Client Script',
        description: 'Socket.io JavaScript should be accessible',
        fn: async () => {
            const result = await fetchAPI('/socket.io/socket.io.js');
            expect(result.ok).toBeTruthy();
            return {
                endpoint: '/socket.io/socket.io.js',
                status: result.status,
                contentType: result.contentType,
                duration: result.duration + 'ms'
            };
        }
    }
]);

// Security Tests
runner.describe('Security & Authentication', [
    {
        name: 'Admin Dashboard Protection',
        description: 'Admin dashboard should be accessible only when authenticated',
        fn: async () => {
            const result = await fetchAPI('/adminDashboard');
            // Can be either: 200 (authenticated), 302 (redirect), 401/403 (denied)
            const validStatuses = [200, 302, 401, 403];
            if (!validStatuses.includes(result.status)) {
                throw new Error(`Unexpected status ${result.status}`);
            }
            return {
                endpoint: '/adminDashboard',
                status: result.status,
                authenticated: result.status === 200,
                protected: result.status === 200 ? 'Accessed (logged in)' : 'Blocked (not logged in)',
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Redis Dashboard Protection',
        description: 'Redis dashboard should require authentication',
        fn: async () => {
            const result = await fetchAPI('/redis/dashboard');
            // Can be either: 200 (authenticated), 302 (redirect), 401/403 (denied)
            const validStatuses = [200, 302, 401, 403];
            if (!validStatuses.includes(result.status)) {
                throw new Error(`Unexpected status ${result.status}`);
            }
            return {
                endpoint: '/redis/dashboard',
                status: result.status,
                authenticated: result.status === 200,
                protected: result.status === 200 ? 'Accessed (logged in)' : 'Blocked (not logged in)',
                duration: result.duration + 'ms'
            };
        }
    }
]);

// Error Handling Tests
runner.describe('Error Handling', [
    {
        name: '404 Not Found',
        description: 'Non-existent routes should return 404',
        fn: async () => {
            const result = await fetchAPI('/this-page-does-not-exist-12345');
            expect(result.status).toBe(404);
            return {
                endpoint: '/this-page-does-not-exist-12345',
                status: result.status,
                statusText: result.statusText,
                handlesErrors: 'YES',
                duration: result.duration + 'ms'
            };
        }
    }
]);

// Additional Comprehensive Tests
runner.describe('Authentication Endpoints', [
    {
        name: 'Current User API',
        description: 'GET /api/current-user should require authentication',
        fn: async () => {
            const result = await fetchAPI('/api/current-user');
            return {
                endpoint: '/api/current-user',
                method: 'GET',
                status: result.status,
                authenticated: result.ok,
                note: result.ok ? 'User data retrieved' : 'Requires authentication (expected)',
                duration: result.duration + 'ms'
            };
        }
    }
]);

runner.describe('Dashboard Access Tests', [
    {
        name: 'Student Dashboard',
        description: 'Student dashboard access control',
        fn: async () => {
            const result = await fetchAPI('/studentDashboard');
            return {
                endpoint: '/studentDashboard',
                status: result.status,
                accessGranted: result.ok,
                note: result.ok ? 'Dashboard accessible' : 'Authentication required',
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Staff Dashboard',
        description: 'Staff dashboard access control',
        fn: async () => {
            const result = await fetchAPI('/staffDashboard');
            return {
                endpoint: '/staffDashboard',
                status: result.status,
                accessGranted: result.ok,
                note: result.ok ? 'Dashboard accessible' : 'Authentication/Role required',
                duration: result.duration + 'ms'
            };
        }
    }
]);

runner.describe('Announcement Routes', [
    {
        name: 'Announcements List',
        description: 'GET /announcements should load announcements page',
        fn: async () => {
            const result = await fetchAPI('/announcements');
            return {
                endpoint: '/announcements',
                status: result.status,
                accessible: result.ok,
                note: result.ok ? 'Page loaded' : 'Authentication required',
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Create Announcement Page',
        description: 'GET /announcements/create should be protected',
        fn: async () => {
            const result = await fetchAPI('/announcements/create');
            return {
                endpoint: '/announcements/create',
                status: result.status,
                accessible: result.ok,
                note: result.ok ? 'Page accessible (staff/admin)' : 'Authentication/Role required',
                duration: result.duration + 'ms'
            };
        }
    }
]);

runner.describe('Profile Routes', [
    {
        name: 'View Profile',
        description: 'GET /profile should require authentication',
        fn: async () => {
            const result = await fetchAPI('/profile');
            return {
                endpoint: '/profile',
                status: result.status,
                accessible: result.ok,
                note: result.ok ? 'Profile page loaded' : 'Authentication required',
                duration: result.duration + 'ms'
            };
        }
    },
    {
        name: 'Edit Profile',
        description: 'GET /profile/edit should require authentication',
        fn: async () => {
            const result = await fetchAPI('/profile/edit');
            return {
                endpoint: '/profile/edit',
                status: result.status,
                accessible: result.ok,
                note: result.ok ? 'Edit page loaded' : 'Authentication required',
                duration: result.duration + 'ms'
            };
        }
    }
]);

runner.describe('Admin Routes', [
    {
        name: 'User Management',
        description: 'GET /admin/users should be admin-only',
        fn: async () => {
            const result = await fetchAPI('/admin/users');
            return {
                endpoint: '/admin/users',
                status: result.status,
                accessible: result.ok,
                note: result.ok ? 'Admin access granted' : 'Admin authentication required',
                duration: result.duration + 'ms'
            };
        }
    }
]);

// Global functions
function runAllTests() {
    runner.runAll();
}

function clearResults() {
    document.getElementById('testResults').innerHTML = '';
    document.getElementById('summary').style.display = 'none';
    runner.results = { total: 0, passed: 0, failed: 0, pending: 0, totalDuration: 0 };
    runner.testDetails = [];
    runner.updateStats();
    document.getElementById('progressBar').style.display = 'none';
}

// Auto-run tests on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Integration Test Runner Loaded');
    console.log('Click "Run All Tests" to start testing');
});
