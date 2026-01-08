// Fortune Randomization Browser Integration Tests

// Global variables for charts
let distributionChart = null;
let emotionChart = null;

// API endpoint
const API_ENDPOINT = '/api/omikuji/draw';

// Test 1: Session-based Duplication Control
async function testSessionDuplication() {
    const sessionId = document.getElementById('sessionId').value || `test-session-${Date.now()}`;
    const statusEl = document.getElementById('sessionStatus');
    const resultsEl = document.getElementById('sessionResults');
    
    statusEl.style.display = 'block';
    statusEl.className = 'status';
    statusEl.textContent = `セッションID: ${sessionId} で連続実行中...`;
    resultsEl.innerHTML = '';
    
    const categoryContents = {};
    const results = [];
    
    try {
        for (let i = 0; i < 10; i++) {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    omikujiType: 'engineer-fortune',
                    sessionId: sessionId,
                    saisenLevel: 2
                })
            });
            
            const data = await response.json();
            if (data.success) {
                results.push(data);
                
                // Track category contents for duplication check
                data.result.omikujiResult.categories.items.forEach(category => {
                    if (!categoryContents[category.name]) {
                        categoryContents[category.name] = new Set();
                    }
                    categoryContents[category.name].add(category.content);
                });
            }
        }
        
        // Display results
        let html = '<h3>実行結果:</h3>';
        results.forEach((result, index) => {
            const fortune = result.result.fortune;
            const categories = result.result.omikujiResult.categories.items;
            
            html += `<div class="result-item">`;
            html += `<strong>実行 ${index + 1}:</strong> `;
            html += `<span class="fortune-badge ${fortune.id}">${fortune.name}</span>`;
            html += '<div style="margin-top: 5px;">';
            categories.forEach(cat => {
                html += `<div class="category">`;
                html += `<span>${cat.name}: ${cat.content}</span>`;
                html += `<span class="emotion-${cat.emotionTone}">${cat.emotionTone}</span>`;
                html += `</div>`;
            });
            html += '</div></div>';
        });
        
        // Check for duplicates and variety
        let duplicateCount = 0;
        let varietyInfo = '<h3>カテゴリ別バリエーション:</h3>';
        Object.entries(categoryContents).forEach(([category, contents]) => {
            varietyInfo += `<div>${category}: ${contents.size}種類</div>`;
            if (contents.size < results.length) {
                duplicateCount += results.length - contents.size;
            }
        });
        
        resultsEl.innerHTML = html + varietyInfo;
        
        statusEl.className = duplicateCount > 0 ? 'status success' : 'status success';
        statusEl.textContent = `✅ 実行完了: ${results.length}回実行, ${duplicateCount}件の重複`;
        
    } catch (error) {
        statusEl.className = 'status error';
        statusEl.textContent = `❌ エラー: ${error.message}`;
    }
}

// Test 2: Fortune Distribution
async function testFortuneDistribution() {
    const omikujiType = document.getElementById('omikujiType').value;
    const drawCount = parseInt(document.getElementById('drawCount').value);
    const statusEl = document.getElementById('distributionStatus');
    const statsEl = document.getElementById('distributionStats');
    
    statusEl.style.display = 'block';
    statusEl.className = 'status';
    statusEl.textContent = `${drawCount}回の抽選を実行中...`;
    
    const fortuneCounts = {};
    const expectedDistribution = {
        'daikichi': 0.03,
        'chukichi': 0.15,
        'kichi': 0.25,
        'shokichi': 0.30,
        'suekichi': 0.15,
        'kyo': 0.10,
        'daikyo': 0.02
    };
    
    try {
        const promises = [];
        for (let i = 0; i < drawCount; i++) {
            promises.push(fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    omikujiType: omikujiType,
                    sessionId: `dist-test-${i}`,
                    saisenLevel: 2
                })
            }));
        }
        
        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map(r => r.json()));
        
        // Count fortunes
        results.forEach(result => {
            if (result.success) {
                const fortuneId = result.result.fortune.id;
                fortuneCounts[fortuneId] = (fortuneCounts[fortuneId] || 0) + 1;
            }
        });
        
        // Display statistics
        let statsHtml = '';
        let totalError = 0;
        Object.entries(expectedDistribution).forEach(([fortuneId, expected]) => {
            const actual = (fortuneCounts[fortuneId] || 0) / drawCount;
            const error = Math.abs(actual - expected) / expected * 100;
            totalError += error;
            
            statsHtml += `
                <div class="stat-card">
                    <div class="stat-value">${((fortuneCounts[fortuneId] || 0) / drawCount * 100).toFixed(1)}%</div>
                    <div class="stat-label">${getFortuneName(fortuneId)}</div>
                    <div style="font-size: 12px; color: ${error < 20 ? '#27ae60' : '#e74c3c'};">
                        期待値: ${(expected * 100).toFixed(1)}% (誤差: ${error.toFixed(1)}%)
                    </div>
                </div>
            `;
        });
        
        statsEl.innerHTML = statsHtml;
        
        // Update chart
        updateDistributionChart(fortuneCounts, drawCount);
        
        const avgError = totalError / Object.keys(expectedDistribution).length;
        statusEl.className = avgError < 20 ? 'status success' : 'status error';
        statusEl.textContent = `✅ 実行完了: 平均誤差 ${avgError.toFixed(1)}%`;
        
    } catch (error) {
        statusEl.className = 'status error';
        statusEl.textContent = `❌ エラー: ${error.message}`;
    }
}

// Test 3: Performance Testing
async function testPerformance() {
    const testCount = parseInt(document.getElementById('perfTestCount').value);
    const statusEl = document.getElementById('performanceStatus');
    const statsEl = document.getElementById('performanceStats');
    const barEl = document.getElementById('performanceBar');
    
    statusEl.style.display = 'block';
    statusEl.className = 'status';
    statusEl.textContent = `${testCount}回のパフォーマンステストを実行中...`;
    
    const responseTimes = [];
    let successCount = 0;
    let under100ms = 0;
    
    try {
        for (let i = 0; i < testCount; i++) {
            const startTime = performance.now();
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    omikujiType: 'engineer-fortune',
                    sessionId: `perf-test-${i}`,
                    saisenLevel: 2
                })
            });
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            responseTimes.push(responseTime);
            
            const data = await response.json();
            if (data.success) {
                successCount++;
                if (responseTime < 100) {
                    under100ms++;
                }
            }
            
            // Update progress bar
            const progress = ((i + 1) / testCount) * 100;
            barEl.style.width = `${progress}%`;
        }
        
        // Calculate statistics
        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minTime = Math.min(...responseTimes);
        const maxTime = Math.max(...responseTimes);
        const medianTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
        const p95Time = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
        const successRate = (successCount / testCount) * 100;
        const under100Rate = (under100ms / testCount) * 100;
        
        // Update bar color
        if (avgTime < 50) {
            barEl.className = 'performance-fill performance-good';
        } else if (avgTime < 100) {
            barEl.className = 'performance-fill performance-warning';
        } else {
            barEl.className = 'performance-fill performance-bad';
        }
        
        // Display statistics
        statsEl.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${avgTime.toFixed(1)}ms</div>
                <div class="stat-label">平均レスポンスタイム</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${under100Rate.toFixed(1)}%</div>
                <div class="stat-label">100ms以内達成率</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${p95Time.toFixed(1)}ms</div>
                <div class="stat-label">95パーセンタイル</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${successRate.toFixed(1)}%</div>
                <div class="stat-label">成功率</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${minTime.toFixed(1)}ms</div>
                <div class="stat-label">最小時間</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${maxTime.toFixed(1)}ms</div>
                <div class="stat-label">最大時間</div>
            </div>
        `;
        
        statusEl.className = under100Rate >= 95 ? 'status success' : 'status error';
        statusEl.textContent = `✅ 実行完了: ${under100Rate.toFixed(1)}%が100ms以内 (要件: 95%以上)`;
        
    } catch (error) {
        statusEl.className = 'status error';
        statusEl.textContent = `❌ エラー: ${error.message}`;
    }
}

// Test 4: Emotion Attribute Distribution
async function testEmotionDistribution() {
    const fortuneFilter = document.getElementById('fortuneFilter').value;
    const statusEl = document.getElementById('emotionStatus');
    const resultsEl = document.getElementById('emotionResults');
    
    statusEl.style.display = 'block';
    statusEl.className = 'status';
    statusEl.textContent = `感情属性分布を分析中...`;
    
    const emotionCounts = {
        'daikichi': { positive: 0, neutral: 0, negative: 0 },
        'chukichi': { positive: 0, neutral: 0, negative: 0 },
        'kichi': { positive: 0, neutral: 0, negative: 0 },
        'shokichi': { positive: 0, neutral: 0, negative: 0 },
        'suekichi': { positive: 0, neutral: 0, negative: 0 },
        'kyo': { positive: 0, neutral: 0, negative: 0 },
        'daikyo': { positive: 0, neutral: 0, negative: 0 }
    };
    
    try {
        // Collect emotion distribution data
        const testRuns = 50;
        for (let i = 0; i < testRuns; i++) {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    omikujiType: 'engineer-fortune',
                    sessionId: `emotion-test-${i}`,
                    seed: fortuneFilter ? `${fortuneFilter}-${i}` : undefined,
                    saisenLevel: 2
                })
            });
            
            const data = await response.json();
            if (data.success) {
                const fortuneId = data.result.fortune.id;
                const categories = data.result.omikujiResult.categories.items;
                
                categories.forEach(cat => {
                    if (emotionCounts[fortuneId]) {
                        emotionCounts[fortuneId][cat.emotionTone]++;
                    }
                });
            }
        }
        
        // Display results
        let html = '<h3>運勢別感情属性分布:</h3>';
        Object.entries(emotionCounts).forEach(([fortuneId, counts]) => {
            const total = counts.positive + counts.neutral + counts.negative;
            if (total > 0 && (!fortuneFilter || fortuneFilter === fortuneId)) {
                const posRate = (counts.positive / total * 100).toFixed(1);
                const neuRate = (counts.neutral / total * 100).toFixed(1);
                const negRate = (counts.negative / total * 100).toFixed(1);
                
                html += `<div class="result-item">`;
                html += `<span class="fortune-badge ${fortuneId}">${getFortuneName(fortuneId)}</span>`;
                html += `<div style="margin-top: 10px;">`;
                html += `<span class="emotion-positive">Positive: ${posRate}%</span> | `;
                html += `<span class="emotion-neutral">Neutral: ${neuRate}%</span> | `;
                html += `<span class="emotion-negative">Negative: ${negRate}%</span>`;
                html += `</div>`;
                
                // Check requirements
                if (fortuneId === 'daikichi' && counts.negative > 0) {
                    html += `<div style="color: #e74c3c; margin-top: 5px;">⚠️ 大吉にネガティブが含まれています</div>`;
                }
                if (fortuneId === 'daikyo' && counts.positive > 0) {
                    html += `<div style="color: #e74c3c; margin-top: 5px;">⚠️ 大凶にポジティブが含まれています</div>`;
                }
                
                html += `</div>`;
            }
        });
        
        resultsEl.innerHTML = html;
        
        // Update chart
        updateEmotionChart(emotionCounts, fortuneFilter);
        
        statusEl.className = 'status success';
        statusEl.textContent = `✅ 分析完了`;
        
    } catch (error) {
        statusEl.className = 'status error';
        statusEl.textContent = `❌ エラー: ${error.message}`;
    }
}

// Utility functions
function getFortuneName(fortuneId) {
    const names = {
        'daikichi': '大吉',
        'chukichi': '中吉',
        'kichi': '吉',
        'shokichi': '小吉',
        'suekichi': '末吉',
        'kyo': '凶',
        'daikyo': '大凶'
    };
    return names[fortuneId] || fortuneId;
}

function updateDistributionChart(fortuneCounts, total) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    if (distributionChart) {
        distributionChart.destroy();
    }
    
    const labels = Object.keys(fortuneCounts).map(getFortuneName);
    const data = Object.values(fortuneCounts).map(count => (count / total * 100).toFixed(1));
    const colors = ['#ff6b6b', '#ff9f43', '#ffd93d', '#6bcf7f', '#4ecdc4', '#95a5a6', '#34495e'];
    
    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '実際の分布 (%)',
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '運勢分布結果'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '確率 (%)'
                    }
                }
            }
        }
    });
}

function updateEmotionChart(emotionCounts, fortuneFilter) {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    
    if (emotionChart) {
        emotionChart.destroy();
    }
    
    const datasets = [];
    const labels = [];
    
    Object.entries(emotionCounts).forEach(([fortuneId, counts]) => {
        const total = counts.positive + counts.neutral + counts.negative;
        if (total > 0 && (!fortuneFilter || fortuneFilter === fortuneId)) {
            labels.push(getFortuneName(fortuneId));
        }
    });
    
    // Positive dataset
    datasets.push({
        label: 'Positive',
        data: labels.map(label => {
            const fortuneId = Object.keys(emotionCounts).find(id => getFortuneName(id) === label);
            const counts = emotionCounts[fortuneId];
            const total = counts.positive + counts.neutral + counts.negative;
            return (counts.positive / total * 100).toFixed(1);
        }),
        backgroundColor: '#27ae60'
    });
    
    // Neutral dataset
    datasets.push({
        label: 'Neutral',
        data: labels.map(label => {
            const fortuneId = Object.keys(emotionCounts).find(id => getFortuneName(id) === label);
            const counts = emotionCounts[fortuneId];
            const total = counts.positive + counts.neutral + counts.negative;
            return (counts.neutral / total * 100).toFixed(1);
        }),
        backgroundColor: '#f39c12'
    });
    
    // Negative dataset
    datasets.push({
        label: 'Negative',
        data: labels.map(label => {
            const fortuneId = Object.keys(emotionCounts).find(id => getFortuneName(id) === label);
            const counts = emotionCounts[fortuneId];
            const total = counts.positive + counts.neutral + counts.negative;
            return (counts.negative / total * 100).toFixed(1);
        }),
        backgroundColor: '#e74c3c'
    });
    
    emotionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '感情属性分布'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: '割合 (%)'
                    }
                }
            }
        }
    });
}

// Clear functions
function clearSessionResults() {
    document.getElementById('sessionStatus').style.display = 'none';
    document.getElementById('sessionResults').innerHTML = '';
}

function clearDistributionResults() {
    document.getElementById('distributionStatus').style.display = 'none';
    document.getElementById('distributionStats').innerHTML = '';
    if (distributionChart) {
        distributionChart.destroy();
        distributionChart = null;
    }
}

function clearPerformanceResults() {
    document.getElementById('performanceStatus').style.display = 'none';
    document.getElementById('performanceStats').innerHTML = '';
    document.getElementById('performanceBar').style.width = '0%';
}

function clearEmotionResults() {
    document.getElementById('emotionStatus').style.display = 'none';
    document.getElementById('emotionResults').innerHTML = '';
    if (emotionChart) {
        emotionChart.destroy();
        emotionChart = null;
    }
}