// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} bndy |{" "}
        <a
          href="https://www.bndy.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          About
        </a>
      </p>
    </footer>
  );
}