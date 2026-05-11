import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Menu from "@/components/Menu";
import Instagram from "@/components/Instagram";
import Reviews from "@/components/Reviews";
import Feedback from "@/components/Feedback";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Menu />
      <Instagram />
      <Reviews />
      <Feedback />
      <Footer />
    </main>
  );
}
