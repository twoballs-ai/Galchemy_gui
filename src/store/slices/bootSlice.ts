// store/slices/bootSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BootState {
  isBooting: boolean;   // показываем splash
  message:   string;    // подпись («Компиляция…»)
}
const initialState: BootState = { isBooting: false, message: "" };

const bootSlice = createSlice({
  name: "boot",
  initialState,
  reducers: {
    startBoot(state, a: PayloadAction<string>) {
      state.isBooting = true;
      state.message   = a.payload;
    },
    finishBoot(state) {
      state.isBooting = false;
      state.message   = "";
    },
  },
});
export const { startBoot, finishBoot } = bootSlice.actions;
export default bootSlice.reducer;
