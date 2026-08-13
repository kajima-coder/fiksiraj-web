import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings, Trash2, ExternalLink } from "lucide-react";

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

      <main
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
        data-testid="delete-account-page"
      >
        <div className="mb-8">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-5">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
            data-testid="delete-account-title"
          >
            Brisanje računa
          </h1>

          <p className="text-gray-600 text-base leading-relaxed">
            Fiksiraj račun možete trajno obrisati izravno unutar aplikacije,
            bez slanja zahtjeva korisničkoj podršci.
          </p>
        </div>

        <div className="space-y-8 text-gray-700 text-base leading-relaxed">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Kako obrisati račun
            </h2>

            <ol className="space-y-3">
              <li>
                <strong>1.</strong> Prijavite se u svoj Fiksiraj račun.
              </li>
              <li>
                <strong>2.</strong> Otvorite <strong>Postavke</strong>.
              </li>
              <li>
                <strong>3.</strong> Pronađite odjeljak{" "}
                <strong>Brisanje računa</strong>.
              </li>
              <li>
                <strong>4.</strong> Odaberite{" "}
                <strong>Trajno obriši račun</strong>.
              </li>
              <li>
                <strong>5.</strong> Potvrdite trajno brisanje.
              </li>
            </ol>

            <Link
              to="/postavke"
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              data-testid="delete-account-settings-link"
            >
              <Settings className="w-4 h-4" />
              Otvori Postavke
            </Link>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Podaci koji se brišu
            </h2>

            <ul className="space-y-2">
              <li>• ime i prezime</li>
              <li>• email adresa</li>
              <li>• telefonski broj</li>
              <li>• profil profesionalca</li>
              <li>• profilne slike i logo firme</li>
              <li>• usluge</li>
              <li>• rezervacije</li>
              <li>• recenzije</li>
              <li>• povezanost Apple pretplate s Fiksiraj računom</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="font-semibold text-amber-900 mb-2">
              Važno za Apple pretplate
            </p>

            <p className="text-sm text-amber-800 mb-3">
              Brisanje Fiksiraj računa ne otkazuje automatski aktivnu pretplatu
              naplaćenu putem Apple računa. Apple pretplatu možete zasebno
              otkazati ili njome upravljati kroz svoj Apple račun.
            </p>

            <a
              href="https://apps.apple.com/account/subscriptions"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 underline"
            >
              Upravljaj Apple pretplatama
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="text-gray-500 text-sm pt-4 border-t border-gray-200">
            Brisanje računa je trajno i nije ga moguće poništiti. Određeni
            podaci mogu se zadržati samo kada je to potrebno radi zakonskih
            ili računovodstvenih obveza.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DeleteAccountPage;