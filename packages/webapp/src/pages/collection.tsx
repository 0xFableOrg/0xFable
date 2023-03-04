import { type NextPage } from "next";
import Head from "next/head";
import { Navbar } from "../components/navbar";

const Play: NextPage = () => {
  return (
    <>
      <Head>
        <title>0xFable: My Collection</title>
        <meta name="description" content="Manage your card collection" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col">
        <Navbar />
        <div className="grid-col-2 mx-6 mb-6 grid grow grid-cols-12 gap-4">
          <div className="col-span-3 grow rounded-xl border">...</div>
          <div className="col-span-9 h-full rounded-xl border">...</div>
        </div>
      </main>
    </>
  );
};

export default Play;
