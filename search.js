// ========================================
// Vital 검색 엔진 - 클라이언트 사이드 검색
// ========================================

let patentsData = [];
let isDataLoaded = false;

// 데이터 로딩
async function loadPatentsData() {
    if (isDataLoaded) return patentsData;
    
    try {
        const response = await fetch('patents.json');
        if (!response.ok) {
            throw new Error('특허 데이터를 불러올 수 없습니다.');
        }
        patentsData = await response.json();
        isDataLoaded = true;
        console.log(`✓ ${patentsData.length}개 특허 데이터 로딩 완료`);
        return patentsData;
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        throw error;
    }
}

// 텍스트 전처리 및 토큰화
function tokenize(text) {
    if (!text) return [];
    
    // 소문자 변환 및 한글, 영문, 숫자만 추출
    const normalized = text.toLowerCase();
    
    // 한글 토큰 추출 (2글자 이상)
    const koreanTokens = normalized.match(/[가-힣]{2,}/g) || [];
    
    // 영문 토큰 추출 (2글자 이상)
    const englishTokens = normalized.match(/[a-z]{2,}/g) || [];
    
    // 숫자 포함 토큰 추출
    const alphanumericTokens = normalized.match(/[a-z0-9]{2,}/g) || [];
    
    // 모든 토큰 합치기 (중복 제거)
    const allTokens = [...new Set([...koreanTokens, ...englishTokens, ...alphanumericTokens])];
    
    return allTokens;
}

// 개선된 유사도 계산 (빈도, 위치, 근접성 고려)
function calculateRelevanceScore(query, patent) {
    const queryTokens = tokenize(query);
    const patentText = (patent.text || '').toLowerCase();
    const patentTitle = (patent.title || '').toLowerCase();
    const patentAbstract = (patent.abstract || '').toLowerCase();
    
    if (queryTokens.length === 0) {
        return 0;
    }
    
    let totalScore = 0;
    let matchedTokenCount = 0;
    
    queryTokens.forEach(token => {
        let tokenScore = 0;
        let foundInDoc = false;
        
        // 1. 제목에서의 매칭 (가중치: 높음)
        if (patentTitle.includes(token)) {
            const titleMatches = (patentTitle.match(new RegExp(token, 'g')) || []).length;
            tokenScore += Math.min(titleMatches * 8, 25); // 빈도에 따라 차등 점수
            foundInDoc = true;
        }
        
        // 2. 요약에서의 매칭 (가중치: 중간)
        if (patentAbstract.includes(token)) {
            const abstractMatches = (patentAbstract.match(new RegExp(token, 'g')) || []).length;
            tokenScore += Math.min(abstractMatches * 4, 15); // 빈도에 따라 차등 점수
            foundInDoc = true;
        }
        
        // 3. 전체 텍스트에서의 매칭 (가중치: 낮음)
        if (patentText.includes(token)) {
            const textMatches = (patentText.match(new RegExp(token, 'g')) || []).length;
            tokenScore += Math.min(textMatches * 2, 12); // 빈도에 따라 차등 점수
            foundInDoc = true;
        }
        
        // 4. 토큰 길이에 따른 가중치 (긴 토큰일수록 중요)
        if (foundInDoc && token.length >= 4) {
            tokenScore *= 1.1; // 10% 보너스
        }
        if (foundInDoc && token.length >= 6) {
            tokenScore *= 1.15; // 추가 15% 보너스
        }
        
        if (foundInDoc) {
            matchedTokenCount++;
        }
        
        totalScore += tokenScore;
    });
    
    // 5. 매칭 커버리지 보너스 (몇 개의 쿼리 토큰이 매칭되었는가)
    const coverageRatio = matchedTokenCount / queryTokens.length;
    
    // 커버리지에 따른 승수 적용
    if (coverageRatio === 1.0) {
        totalScore *= 1.3; // 모든 토큰 매칭 시 30% 보너스
    } else if (coverageRatio >= 0.8) {
        totalScore *= 1.15; // 80% 이상 매칭 시 15% 보너스
    } else if (coverageRatio >= 0.6) {
        totalScore *= 1.05; // 60% 이상 매칭 시 5% 보너스
    } else if (coverageRatio < 0.4) {
        totalScore *= 0.7; // 40% 미만 매칭 시 30% 감점
    }
    
    // 6. 쿼리 토큰 수에 따른 정규화
    const maxPossibleScore = queryTokens.length * 50; // 토큰당 최대 50점
    let normalizedScore = (totalScore / maxPossibleScore) * 100;
    
    // 7. 단일 토큰 검색 페널티
    if (queryTokens.length === 1) {
        normalizedScore *= 0.65;
    }
    
    // 8. 문서 길이 정규화 (너무 짧거나 긴 문서에 대한 보정)
    const docLength = patentText.length;
    if (docLength < 200) {
        normalizedScore *= 0.9; // 너무 짧은 문서는 감점
    } else if (docLength > 5000) {
        normalizedScore *= 0.95; // 너무 긴 문서는 약간 감점
    }
    
    // 9. 토큰 근접성 보너스 (쿼리 토큰들이 문서에서 가까이 있는지)
    if (queryTokens.length >= 2 && matchedTokenCount >= 2) {
        const proximityBonus = calculateProximityBonus(queryTokens, patentText);
        normalizedScore += proximityBonus;
    }
    
    // 최종 점수를 0-100 범위로 제한
    return Math.min(100, Math.max(0, Math.round(normalizedScore * 10) / 10)); // 소수점 1자리
}

// 토큰 근접성 보너스 계산 (쿼리 토큰들이 문서에서 얼마나 가까이 있는지)
function calculateProximityBonus(queryTokens, text) {
    let minDistance = Infinity;
    
    // 각 쿼리 토큰의 위치 찾기
    const positions = {};
    queryTokens.forEach(token => {
        const regex = new RegExp(token, 'g');
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push(match.index);
        }
        if (matches.length > 0) {
            positions[token] = matches;
        }
    });
    
    // 최소 2개 이상의 토큰이 발견된 경우에만 계산
    const foundTokens = Object.keys(positions);
    if (foundTokens.length < 2) {
        return 0;
    }
    
    // 토큰 쌍 간의 최소 거리 계산
    for (let i = 0; i < foundTokens.length - 1; i++) {
        for (let j = i + 1; j < foundTokens.length; j++) {
            const token1Positions = positions[foundTokens[i]];
            const token2Positions = positions[foundTokens[j]];
            
            token1Positions.forEach(pos1 => {
                token2Positions.forEach(pos2 => {
                    const distance = Math.abs(pos1 - pos2);
                    minDistance = Math.min(minDistance, distance);
                });
            });
        }
    }
    
    // 거리에 따른 보너스 점수 (가까울수록 높은 점수)
    if (minDistance < 50) {
        return 5; // 매우 가까움
    } else if (minDistance < 100) {
        return 3; // 가까움
    } else if (minDistance < 200) {
        return 2; // 중간
    } else if (minDistance < 500) {
        return 1; // 멀지만 같은 문맥
    }
    
    return 0;
}

// 검색 실행
async function searchPatents(query, minSimilarity = 5) {
    try {
        // 데이터 로딩
        if (!isDataLoaded) {
            await loadPatentsData();
        }
        
        console.log(`검색 쿼리: "${query}"`);
        console.log(`최소 유사도: ${minSimilarity}%`);
        
        // 모든 특허에 대해 점수 계산
        const results = patentsData.map(patent => {
            const score = calculateRelevanceScore(query, patent);
            return {
                ...patent,
                similarity: score
            };
        });
        
        // 점수 순으로 정렬
        results.sort((a, b) => b.similarity - a.similarity);
        
        // 최소 유사도 이상인 결과만 필터링
        const filteredResults = results.filter(r => r.similarity >= minSimilarity);
        
        console.log(`전체 특허: ${results.length}개`);
        console.log(`점수 > 0: ${results.filter(r => r.similarity > 0).length}개`);
        console.log(`유사도 ${minSimilarity}% 이상: ${filteredResults.length}개`);
        
        if (filteredResults.length > 0) {
            console.log(`상위 10개 점수:`, filteredResults.slice(0, 10).map(r => ({
                score: r.similarity.toFixed(1),
                title: r.title.substring(0, 30)
            })));
        }
        
        return filteredResults;
    } catch (error) {
        console.error('검색 실패:', error);
        throw error;
    }
}

// 검색 결과 표시
function displaySearchResults(results, query) {
    const resultsInfo = document.getElementById('resultsInfo');
    const resultsCount = document.getElementById('resultsCount');
    const loadingResults = document.getElementById('loadingResults');
    const noResults = document.getElementById('noResults');
    const resultsList = document.getElementById('resultsList');
    
    // 로딩 숨기기
    loadingResults.style.display = 'none';
    
    if (results.length === 0) {
        // 결과 없음
        noResults.style.display = 'block';
        resultsList.style.display = 'none';
        resultsInfo.style.display = 'none';
    } else {
        // 결과 표시
        noResults.style.display = 'none';
        resultsList.style.display = 'block';
        resultsInfo.style.display = 'block';
        
        // 결과 개수 표시
        resultsCount.textContent = `약 ${results.length.toLocaleString()}개의 결과 (검색어: "${query}")`;
        
        // 결과 리스트 생성
        resultsList.innerHTML = '';
        
        // 상위 100개만 표시 (성능 고려)
        const displayResults = results.slice(0, 100);
        
        displayResults.forEach((patent, index) => {
            const resultItem = createResultItem(patent, index);
            resultsList.appendChild(resultItem);
        });
    }
}

// 개별 결과 아이템 생성
function createResultItem(patent, index) {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    // 유사도를 소수점 1자리까지 표시
    const similarity = patent.similarity.toFixed(1);
    const similarityNum = parseFloat(similarity);
    
    // 유사도에 따른 색상 결정
    let similarityColor = '#4285F4'; // 파랑 (기본)
    if (similarityNum >= 80) {
        similarityColor = '#34A853'; // 초록 (매우 높음)
    } else if (similarityNum >= 60) {
        similarityColor = '#4285F4'; // 파랑 (높음)
    } else if (similarityNum >= 40) {
        similarityColor = '#FBBC04'; // 노랑 (중간)
    } else {
        similarityColor = '#EA4335'; // 빨강 (낮음)
    }
    
    item.innerHTML = `
        <div class="result-header">
            <span class="result-app-no">${patent.app_no || '출원번호 없음'}</span>
            <div class="similarity-badge">
                <span class="similarity-percentage" style="color: ${similarityColor}">${similarity}%</span>
                <div class="similarity-bar">
                    <div class="similarity-fill" style="width: ${similarityNum}%; background: ${similarityColor}"></div>
                </div>
            </div>
        </div>
        <h3 class="result-title">${highlightQuery(patent.title, '')}</h3>
        <p class="result-abstract">${patent.abstract}</p>
    `;
    
    // 제목 클릭 시 (현재는 기능 없음, 향후 확장 가능)
    const titleElement = item.querySelector('.result-title');
    titleElement.addEventListener('click', () => {
        console.log('특허 클릭:', patent.app_no);
        // 향후: 특허 상세 페이지로 이동하거나 모달 표시
    });
    
    return item;
}

// 쿼리 하이라이트 (간단한 버전)
function highlightQuery(text, query) {
    // 현재는 하이라이트 없이 텍스트 그대로 반환
    // 향후 확장: 쿼리 키워드 강조 표시
    return text;
}

// 페이지별 검색 실행 함수
async function performSearchOnPage(query) {
    try {
        // 최소 유사도 임계값 (20% - 엄격한 기준)
        const MIN_SIMILARITY = 20;
        
        console.log('=== 검색 시작 ===');
        console.log('쿼리:', query);
        
        // 검색 실행
        const results = await searchPatents(query, MIN_SIMILARITY);
        
        console.log('검색 완료. 결과:', results.length, '개');
        
        // 결과 표시
        displaySearchResults(results, query);
        
    } catch (error) {
        console.error('검색 오류:', error);
        
        // 오류 표시
        const loadingResults = document.getElementById('loadingResults');
        const noResults = document.getElementById('noResults');
        
        loadingResults.style.display = 'none';
        noResults.style.display = 'block';
        noResults.querySelector('h2').textContent = '검색 중 오류가 발생했습니다';
        noResults.querySelector('p').textContent = error.message || '잠시 후 다시 시도해 주세요.';
    }
}

// 데이터 사전 로딩 (옵션)
if (typeof window !== 'undefined') {
    // 페이지 로드 시 데이터 미리 로드 (검색 페이지인 경우)
    if (window.location.pathname.includes('search.html')) {
        loadPatentsData().catch(console.error);
    }
}
