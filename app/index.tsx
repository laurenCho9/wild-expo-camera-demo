import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Alert, Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExpoCameraDemoScreen() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

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
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        Alert.alert("사진 촬영 완료", `사진이 저장되었습니다: ${photo.uri}`);
      } catch {
        Alert.alert("오류", "사진 촬영에 실패했습니다.");
      }
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {isCameraOn && permission.granted && (
        <CameraView
          ref={cameraRef}
          flash="on"
          autofocus="on"
          style={{ flex: 1 }}
        />
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
      </View>
    </SafeAreaView>
  );
}
