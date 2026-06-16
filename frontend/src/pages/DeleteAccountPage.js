import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DeleteAccountPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "'Sora', sans-serif" }}
            data-testid="delete-account-home-link"
          >
            Fiksiraj
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            data-testid="delete-account-back-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Natrag
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16" data-testid="delete-account-page">
        <h1
          className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8"
          style={{ fontFamily: "'Sora', sans-serif" }}
          data-testid="delete-account-title"
        >
          Brisanje računa
        </h1>

        <div className="space-y-6 text-gray-700 text-base leading-relaxed">
          <p>
            Ako želite trajno obrisati svoj Fiksiraj račun i povezane osobne podatke, pošaljite zahtjev na:
          </p>

          <p>
            <a
              href="mailto:support@solvix.hr"
              className="text-blue-600 font-semibold hover:underline"
              data-testid="delete-account-email-link"
            >
              support@solvix.hr
            </a>
          </p>

          <p>
            Nakon potvrde identiteta račun i povezani korisnički podaci bit će trajno obrisani.
          </p>

          <div>
            <p className="mb-3">Podaci koji se brišu uključuju:</p>
            <ul className="space-y-2 pl-1">
              <li>• ime i prezime</li>
              <li>• email adresu</li>
              <li>• telefonski broj</li>
              <li>• profil profesionalca</li>
              <li>• rezervacije</li>
              <li>• recenzije</li>
            </ul>
          </div>

          <p className="text-gray-500 text-sm pt-4 border-t border-gray-200">
            Određeni podaci mogu se zadržati ako je to potrebno radi zakonskih ili računovodstvenih obveza.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DeleteAccountPage;
