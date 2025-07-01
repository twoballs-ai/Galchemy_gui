// components/SplashScreen.tsx
import { Spin, Typography } from "antd";
import "./SplashScreen.scss";         // фон + анимации

const SplashScreen: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="splash-container">
    <Spin size="large" />
    <Typography.Text style={{ marginTop: 16, color: "#e0e0e0" }}>
      {msg}
    </Typography.Text>
  </div>
);
export default SplashScreen;
