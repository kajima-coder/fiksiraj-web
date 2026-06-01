
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Politika privatnosti</h1>

        <p>
          Posljednje ažuriranje: 2026.
        </p>

        <p>
          Ova Pravila privatnosti opisuju kako Solvix, obrt za IT usluge,
          vl. Antonio Bjeljac, Zagreb, Hrvatska (u daljnjem tekstu:
          „mi“, „nas“ ili „Platforma“) prikuplja, koristi i štiti osobne
          podatke korisnika web stranice i aplikacije Solvix.
        </p>

        <p>
          Korištenjem Platforme prihvaćate ova Pravila privatnosti.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          1. Voditelj obrade
        </h2>

        <p>
          Solvix, obrt za IT usluge<br />
          vl. Antonio Bjeljac<br />
          Zagreb, Hrvatska
        </p>

        <p>
          Kontakt email: support@solvix.hr
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          2. Podaci koje prikupljamo
        </h2>

        <h3 className="text-xl font-semibold">
          a) Profesionalci / izvođači usluga
        </h3>

        <ul className="list-disc pl-6 space-y-1">
          <li>ime i prezime</li>
          <li>naziv obrta ili tvrtke</li>
          <li>email adresu</li>
          <li>broj telefona</li>
          <li>lokaciju / grad</li>
          <li>opis usluga</li>
          <li>podatke povezane s rezervacijama</li>
        </ul>

        <h3 className="text-xl font-semibold">
          b) Korisnici
        </h3>

        <ul className="list-disc pl-6 space-y-1">
          <li>ime i prezime</li>
          <li>email adresu</li>
          <li>broj telefona</li>
          <li>podatke o rezervacijama</li>
          <li>opis problema ili zahtjeva za uslugu</li>
        </ul>

        <h3 className="text-xl font-semibold">
          c) Tehnički podaci
        </h3>

        <ul className="list-disc pl-6 space-y-1">
          <li>IP adresu</li>
          <li>podatke o uređaju i pregledniku</li>
          <li>logove sustava</li>
          <li>tehničke podatke potrebne za sigurnost i funkcioniranje Platforme</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          3. Svrha obrade podataka
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>omogućavanje rezervacija i korištenja Platforme</li>
          <li>komunikaciju između korisnika i profesionalaca</li>
          <li>slanje email obavijesti i podsjetnika</li>
          <li>omogućavanje recenzija i ocjena</li>
          <li>sigurnost sustava i sprječavanje zlouporaba</li>
          <li>poboljšanje funkcionalnosti i stabilnosti Platforme</li>
          <li>ispunjavanje zakonskih obveza</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          4. Pravna osnova obrade
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>izvršenja ugovora i pružanja usluge</li>
          <li>legitimnog interesa</li>
          <li>zakonskih obveza</li>
          <li>privole korisnika kada je primjenjivo</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          5. Dijeljenje podataka
        </h2>

        <p>
          Podaci se mogu dijeliti s pouzdanim pružateljima usluga potrebnim za rad Platforme.
        </p>

        <ul className="list-disc pl-6 space-y-1">
          <li>Vercel</li>
          <li>Railway</li>
          <li>MongoDB Atlas</li>
          <li>SendGrid</li>
          <li>Stripe</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          6. Plaćanja i Stripe
        </h2>

        <p>
          Online plaćanja i pretplate obrađuju se putem Stripe platforme.
        </p>

        <p>
          Mi ne pohranjujemo potpune podatke o platnim karticama korisnika.
        </p>

        <p>
          Više informacija: https://stripe.com/privacy
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          7. Čuvanje podataka
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>dok je korisnički račun aktivan</li>
          <li>dok je potrebno za pružanje usluge</li>
          <li>koliko nalažu zakonske obveze</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          8. Prava korisnika
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>pristupa podacima</li>
          <li>ispravka podataka</li>
          <li>brisanja podataka</li>
          <li>ograničenja obrade</li>
        </ul>

        <p>
          Zahtjeve možete poslati na support@solvix.hr
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          9. Sigurnost podataka
        </h2>

        <p>
          Poduzimamo razumne tehničke i organizacijske mjere za zaštitu osobnih podataka.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          10. Recenzije i sadržaj korisnika
        </h2>

        <p>
          Recenzije mogu ostavljati samo korisnici koji su imali dovršenu rezervaciju putem Platforme.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          11. Kolačići i analitika
        </h2>

        <p>
          Platforma može koristiti kolačiće i osnovne analitičke alate radi poboljšanja korisničkog iskustva.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          12. Izmjene Pravila privatnosti
        </h2>

        <p>
          Zadržavamo pravo izmjene ovih Pravila privatnosti u bilo kojem trenutku.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          13. Kontakt
        </h2>

        <p>
          support@solvix.hr
        </p>
      </div>
    </div>
  );
}
