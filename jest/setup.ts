/* Mock de AsyncStorage para jest (recomendado por la librería) */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
