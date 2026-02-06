# expo 카메라
말씀: sensors 안드로이드만 되는데 이부분 검토
expo sensors

말씀: zoom in 터지는 이유 명확히 찾아내기

말씀: Expo Camera의 autofocus="on" 포커스 어떻게 측정할지 값 로직으로 검토

----

https://chatgpt.com/c/698466b6-aa18-8322-b7c1-4e7f9234a8d3

초기세팅

```
npx create-expo-app@latest
```

설치한 라이브러리

```
npx expo install expo-camera
```

go 환경 실행

```
npx expo start --clear
```

## 테스트 결과

안드로이드

- 플래시 굿
- 오토포커징 확인 불가 다만 가까이 가면 선명해짐

ios

- 플래시 굿
- 오토포커징 확인 불가 + 처참 (심지어 가까이가도 흐림)

# 이슈

## 1️⃣ flash="auto" — 어두울 때만 켜지냐?

✅ 결론부터

**“대체로 어두울 때만 켜진다”**가 맞지만,
👉 Expo(Camera / OS)가 내부적으로 판단한다.

<CameraView flash="auto" />

실제 동작 방식

Expo가 직접 조도를 계산해서 제어 ❌

**iOS / Android 카메라 시스템(OS)**가 판단 ⭕

즉,

전체 프레임 밝기

ISO / 노출

얼굴 인식 여부 (특히 iOS)
같은 제조사 알고리즘 기준으로

👉 “이 상황이면 플래시가 도움이 된다” 싶을 때만 켜짐

그래서 생기는 특징

어두워 보여도 안 켜질 수 있음

밝아 보여도 켜질 수 있음

기기마다 다르게 느껴질 수 있음

### 📌 중요

flash="auto"는 UX용 옵션이지, 조도 판별 API가 아니다

---

## 2️⃣ autofocus="off" — 중앙이 더 선명해지냐?

❌ 이건 완전히 오해야
<CameraView autofocus="off" />

실제 의미

초점 고정 (fixed focus) 이다

“중앙에 자동으로 맞춘다” ❌

“한 번 잡힌 초점 거리로 계속 간다” ⭕

autofocus ON vs OFF 차이
🔹 autofocus="on" (기본값, 추천)

피사체 움직이면 계속 재초점

손떨림/거리 변화에 강함

일반 촬영에 적합

🔹 autofocus="off"

초점 거리 고정

가까워지거나 멀어지면 바로 흐려짐

중앙이 더 선명해지는 효과 ❌

오히려 실사용에선 더 불리

---

## 3️⃣-1️⃣ “중앙 집중해서 선명하게” 하고 싶으면 어떻게 해야 하냐?

### ❗ Expo Camera에서는 불가능

수동 포커스 포인트 지정 ❌

focus depth 제어 ❌

이건 react-native-vision-camera + native plugin 영역임.

---

## 3️⃣-2️⃣ 정확히 “tap to focus(터치한 지점을 기준으로 초점)” 하고 싶으면 어떻게 해야 하냐?

### ❌ 결론: 불가능

Expo Camera는 다음 기능들을 제공하지 않음:

❌ focus point 지정
❌ exposure point 지정
❌ tap location → camera focus 연결
❌ 수동 포커스 depth 제어

공식 문서 기준으로도:

CameraView는 포커스 포인트 제어 API가 없다

### Expo Camera의 autofocus="on"은 무엇이냐?

<CameraView autofocus="on" />

이건 정확히 말하면

Continuous Auto Focus

카메라가 프레임 전체를 보고 자동으로 계속 재초점

❌ 특정 위치를 기준으로 하지 않음

❌ 터치 이벤트와 연동 불가

즉,

“자동 초점”이지
“터치한 지점 기준 자동 초점”이 아님

### 그럼 화면을 탭해도 아무 의미 없나?

UI적으로는 가능
<Pressable onPress={(e) => {
const { locationX, locationY } = e.nativeEvent;
}}>

좌표는 얻을 수 있음

포커스 링 UI 그리기 가능 ⭕

실제 카메라 초점에는 영향 ❌

👉 즉, “카메라 앱처럼 보이게”는 할 수 있지만

### 👉 실제 포커싱은 안 바뀜

---

4️⃣ 진짜 Tap to Focus를 하려면?
✅ 정답: react-native-vision-camera

이 라이브러리는 네가 말한 그 autofocus를 정확히 지원함

가능한 것들:

✅ 터치한 위치로 focus
✅ exposure 제어
✅ focus lock
✅ 실시간 frame 처리

### 한 줄 요약

Expo Camera의 autofocus="on"은
“중앙을 기준으로 초점을 잡는다”가 아니라
“프레임 전체를 보고, 가장 그럴듯한 초점을 계속 유지한다”는 의미야.

## 빅이슈

### ‼️ QR은 작은데 카메라 가이드라인이 너무 크다.

그래서 흐린 얼룩무늬처럼 됨

Vision Camera로 바꾸면 “조금” 나아질 수는 있지만
이 UI에서 QR이 너무 작은 구조 자체가 제일 큰 원인이다.

즉 👉 카메라 라이브러리 교체만으로는 해결 안 된다.
각 플랫폼 기본 카메라로도 해결되지 않는다.

### 각 실기기 내장 카메라도 똑같은 이슈였음.

#### 이슈 해결 방법 => Pinch 해주면 됌. 안내문구 추가 필요

근데 궁금한게 expo-camera가 각 실기기 카메라에 접근해서 띄워주는거 맞는가.
그럼 내장 카메라앱이나 expo camera를 쓰나 똑같은 게 맞는가?

결론부터 정확히 말하면

expo-camera는 실기기 ‘내장 카메라 하드웨어’에 접근해서
OS가 제공하는 카메라 파이프라인을 그대로 써서 프리뷰를 띄운다.

그래서

QR이 작아서 흐려지는 문제는
내장 카메라 앱이든, expo-camera든, 다른 앱이든
“거의 같은 물리적 한계”를 가진다.

이건 네가 관찰한 게 완전히 맞다.
