# Vital 검색 엔진 - 빠른 시작 가이드 ⚡

## 📦 압축 해제

```bash
unzip vital_demo.zip
cd vital_demo
```

## 🧪 로컬 테스트 (선택사항)

### 방법 1: Python 사용
```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

### 방법 2: Node.js 사용
```bash
npx http-server -p 8000
# 브라우저에서 http://localhost:8000 접속
```

## 🚀 GitHub Pages 배포

### Step 1: GitHub 리포지토리 생성
1. GitHub에 로그인
2. 우측 상단 **+** 클릭 → **New repository**
3. 리포지토리 이름 입력 (예: `vital-patent-search`)
4. **Public** 선택
5. **Create repository** 클릭

### Step 2: 파일 업로드

#### 방법 A: 웹 인터페이스 사용
1. 생성된 리포지토리 페이지에서 **Add file** → **Upload files** 클릭
2. `vital_demo` 폴더 내 모든 파일 드래그 앤 드롭
3. **Commit changes** 클릭

#### 방법 B: Git 명령어 사용
```bash
cd vital_demo

# Git 초기화
git init

# 파일 추가
git add .
git commit -m "Initial commit: Vital patent search engine"

# 리모트 추가 (YOUR_USERNAME을 실제 GitHub 계정명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/vital-patent-search.git

# 푸시
git branch -M main
git push -u origin main
```

### Step 3: GitHub Pages 활성화
1. 리포지토리 페이지에서 **Settings** 클릭
2. 좌측 메뉴에서 **Pages** 선택
3. **Source** 섹션에서:
   - Branch: **main** 선택
   - Folder: **/ (root)** 선택
4. **Save** 클릭
5. 2-3분 후 페이지 상단에 배포 완료 메시지와 URL 표시

### 접속 URL
```
https://YOUR_USERNAME.github.io/vital-patent-search/
```

## ✅ 배포 확인

1. 위 URL로 접속
2. Vital 로고와 검색창이 보이는지 확인
3. 검색어 입력 (예: "히알루론산 보습")
4. Enter 키 또는 검색 버튼 클릭
5. 검색 결과가 표시되는지 확인

## 🔧 문제 해결

### 1. "유사한 특허를 발견할 수 없습니다" 메시지 표시
- **원인**: 검색어가 너무 구체적이거나 스킨케어와 무관
- **해결**: 더 일반적인 키워드 사용 (예: "보습", "미백", "주름")

### 2. 페이지가 로딩되지 않음
- **원인**: GitHub Pages 활성화 대기 중
- **해결**: 2-3분 기다린 후 새로고침

### 3. 404 오류
- **원인**: 파일 업로드 미완료 또는 경로 오류
- **해결**: 
  - 모든 파일이 리포지토리 루트에 있는지 확인
  - `index.html`이 존재하는지 확인

### 4. 검색 기능이 작동하지 않음
- **원인**: `patents.json` 파일 누락 또는 손상
- **해결**: 
  - 파일이 올바르게 업로드되었는지 확인
  - 브라우저 콘솔(F12)에서 오류 메시지 확인

## 📱 모바일 접속

GitHub Pages URL은 모바일에서도 접속 가능합니다:
- 모바일 브라우저에서 동일한 URL 입력
- QR 코드 생성기로 QR 코드 만들어 공유 가능

## 🎉 완료!

이제 전 세계 어디서나 Vital 검색 엔진에 접속할 수 있습니다!

---

**추가 지원이 필요하시면 GitHub Issues에 문의하세요.**
