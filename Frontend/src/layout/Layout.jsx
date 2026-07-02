import React from "react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Routers from "../routes/Routers";
import ChatAssistant from "../components/ChatAssistant/ChatAssistant";

const Layout = () => {
  return (
    <div>
      <Header />
      <main>
        <Routers />
      </main>
      <ChatAssistant />
      <Footer />
    </div>
  );
};

export default Layout;
