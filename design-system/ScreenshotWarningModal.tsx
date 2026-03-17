import React from "react";
import { Modal, View, Pressable } from "react-native";
import { Heading, Body, Caption } from "./Typography";
import { Button } from "./Button";

export interface ScreenshotWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const ScreenshotWarningModal = React.memo<ScreenshotWarningModalProps>(
  ({ visible, onDismiss }) => {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={onDismiss}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 mx-6"
            onPress={(e) => e.stopPropagation()}
          >
            <Heading className="text-center mb-2">
              No screenshots on the planet.
            </Heading>
            <Body className="text-center text-gray-600 mb-2">
              What are you some sick clumsy fingered freak?
            </Body>
            <Caption className="text-center text-gray-400 mb-6">
              The authorities have been notified.
            </Caption>
            <Button onPress={onDismiss}>OK</Button>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }
);

ScreenshotWarningModal.displayName = "ScreenshotWarningModal";
