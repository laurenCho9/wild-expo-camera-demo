import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type PhotoItem = {
  id: string;
  uri: string;
};

export default function ExpoCameraDemoScreen() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraDimensions, setCameraDimensions] = useState({
    width: 300,
    height: 400,
  });
  const [zoom, setZoom] = useState(0); // 0 ~ 1

  const [photos, setPhotos] = useState<{ id: string; uri: string }[]>([]);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);

  const toggleCamera = async () => {
    if (!permission) {
      await requestPermission();
    }

    if (permission?.granted) {
      setIsCameraOn(!isCameraOn);
    } else {
      Alert.alert(
        "권한 필요",
        "카메라를 사용하려면 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
        [
          { text: "취소", style: "cancel" },
          { text: "권한 요청", onPress: requestPermission },
        ],
      );
    }
  };

  const takePicture = async () => {
    // ✅ 촬영 버튼 누르는 순간, 무조건 카메라로 복귀
    setSelectedPhotoUri(null);

    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      const item = {
        id: Date.now().toString(),
        uri: photo.uri,
      };

      // ✅ 썸네일은 유지 + 순서대로 누적
      setPhotos((prev) => [...prev, item]);
    } catch {
      Alert.alert("오류", "사진 촬영에 실패했습니다.");
    }
  };

  if (!permission) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>카메라 권한을 확인하는 중...</Text>
      </SafeAreaView>
    );
  }

  const pinchGesture = Gesture.Pinch().onUpdate((e) => {
    const nextZoom = Math.min(1, Math.max(0, zoom + (e.scale - 1) * 0.1));
    setZoom(nextZoom);
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {isCameraOn && permission.granted && (
        <View
          style={{
            width: "100%",
            aspectRatio: 4 / 3, // 👈 정사각형보다 가로 긴 비율
            backgroundColor: "black",
          }}
        >
          {selectedPhotoUri ? (
            <Image
              source={{ uri: selectedPhotoUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          ) : (
            <GestureDetector gesture={pinchGesture}>
              <CameraView
                ref={cameraRef}
                facing="back"
                autofocus="on"
                zoom={zoom} // 🔥 이거 없으면 100% 안 됨
                style={{ width: "100%", height: "100%" }}
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  setCameraDimensions({ width, height });
                }}
              />
            </GestureDetector>
          )}

          {/* 정사각형 가이드 박스 */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width:
                Math.min(cameraDimensions.width, cameraDimensions.height) * 0.7,
              height:
                Math.min(cameraDimensions.width, cameraDimensions.height) * 0.7,
              marginLeft: -(
                Math.min(cameraDimensions.width, cameraDimensions.height) * 0.35
              ),
              marginTop: -(
                Math.min(cameraDimensions.width, cameraDimensions.height) * 0.35
              ),
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.8)",
              borderStyle: "dashed",
              borderRadius: 8,
            }}
          />
        </View>
      )}

      <View style={{ padding: 20 }}>
        {!permission.granted && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ textAlign: "center", marginBottom: 10 }}>
              카메라 권한이 필요합니다
            </Text>
            <Button title="권한 요청" onPress={requestPermission} />
          </View>
        )}
        {isCameraOn && permission.granted && (
          <View style={{ marginTop: 10 }}>
            <Button title="촬영하기" onPress={takePicture} color="#ff4444" />
          </View>
        )}
        <Button
          title={isCameraOn ? "카메라 끄기" : "카메라 켜기"}
          onPress={toggleCamera}
          disabled={!permission.granted}
        />

        {photos.length > 0 && (
          <FlatList
            data={photos}
            horizontal
            keyExtractor={(item) => item.id}
            style={{ marginTop: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => setSelectedPhotoUri(item.uri)}>
                <View
                  style={{
                    width: 64,
                    height: 64, // ✅ 정사각형
                    marginRight: 8,
                    borderRadius: 6,
                    backgroundColor: "#222",
                    overflow: "hidden",
                    borderWidth: selectedPhotoUri === item.uri ? 2 : 0,
                    borderColor: "#ff4444",
                  }}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
