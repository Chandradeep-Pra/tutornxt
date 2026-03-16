import type { NextPageContext } from "next";

interface ErrorPageProps {
  statusCode?: number;
}

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        background: "#f7fdf3",
        color: "#17331a",
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
          Tutor Unavailable
        </p>
        <h1 style={{ fontSize: "32px", marginTop: "12px", marginBottom: "12px" }}>
          {statusCode ? `Error ${statusCode}` : "Something went wrong"}
        </h1>
        <p style={{ maxWidth: "420px", lineHeight: 1.6 }}>
          The tutor hit a temporary issue. Please retry in a moment.
        </p>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};
