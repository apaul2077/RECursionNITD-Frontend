import { createContext, useEffect, useState } from "react";
import { login } from "../api/login";
import { refresh } from "../api/refreshToken";
import jwtDecode from "jwt-decode";

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );

  const loginUser = async (formData) => {
    login(formData)
      .then((data) => {
        localStorage.setItem("authTokens", JSON.stringify(data));
        setUser(jwtDecode(data?.access).user_id);
        setAuthToken(data);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const logoutUser = () => {
    localStorage.removeItem("authTokens");
    setUser(null);
    setAuthToken(null);
  };

  const refreshTokens = async () => {
    refresh(authToken.refresh)
      .then((data) => {
        data = { access: data.access, refresh: authToken?.refresh };
        localStorage.setItem("authTokens", JSON.stringify(data));
        setAuthToken(data);
        setUser(jwtDecode(data?.access).user_id);
      })
      .catch((err) => {
        console.log("err", err);
        logoutUser();
        // history.pushState("/login");
      });
    if (loading) setLoading(false);
  };

  const contextData = {
    user: user,
    token: authToken,
    loginUser: loginUser,
    logoutUser: logoutUser,
  };

  useEffect(() => {
    if (loading) refreshTokens();

    let interval = setInterval(() => {
      if (authToken) {
        refreshTokens();
      }
    }, 360000);
    return () => clearInterval(interval);
  }, [authToken, loading]);

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};
