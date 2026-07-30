import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            data-testid="terms-back-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Natrag
          </Link>
        </div>
        <h1 className="text-4xl font-bold">Uvjeti korištenja</h1>

        <p>
          Posljednje ažuriranje: 2026.
        </p>

        <p>
          Ovi Uvjeti korištenja uređuju korištenje aplikacije i web stranice
          Solvix (“Platforma”), kojom upravlja Solvix, obrt za IT usluge,
          vl. Antonio Bjeljac, sa sjedištem u Zagrebu, Hrvatska.
        </p>

        <p>
          Korištenjem Platforme prihvaćate ove Uvjete korištenja.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          1. Opis usluge
        </h2>

        <p>
          Platforma omogućuje povezivanje korisnika i profesionalaca putem sustava rezervacija i recenzija.
        </p>

        <ul className="list-disc pl-6 space-y-1">
          <li>izradu profesionalnih profila</li>
          <li>pretragu profesionalaca</li>
          <li>rezervaciju termina</li>
          <li>komunikaciju između korisnika i profesionalaca</li>
          <li>ostavljanje recenzija nakon usluge</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          2. Tko može koristiti Platformu
        </h2>

        <p>
          Platformu mogu koristiti punoljetne fizičke i pravne osobe.
        </p>

        <p>
          Profesionalac koji otvara profil jamči da ima pravo obavljati ponuđene usluge
          i da su uneseni podaci točni i ažurni.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          3. Profesionalni računi
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>točnost podataka o sebi ili poslovnom subjektu</li>
          <li>zakonitost usluga koje nudi</li>
          <li>ažuriranje cijena i dostupnosti</li>
          <li>sigurnost pristupnih podataka</li>
        </ul>

        <p>
          Zadržavamo pravo suspendirati ili ukloniti račun u slučaju zlouporabe ili kršenja pravila.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          4. Rezervacije
        </h2>

        <p>
          Korisnik može putem Platforme poslati zahtjev za rezervaciju usluge i termina.
        </p>

        <p>
          Rezervacija nije potvrđena dok profesionalac ne prihvati zahtjev
          ili dok sustav ne prikaže potvrđeni status.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          5. Cijene, pretplate i plaćanje
        </h2>

        <p>
          Cijene određuje profesionalac, osim ako nije drugačije navedeno.
        </p>

        <p>
          Platforma može koristiti model pretplate za profesionalne korisnike.
        </p>

        <p>
          Plaćanja i pretplate obrađuju se putem Stripe platforme.
        </p>

        <p>
          Ne pohranjujemo potpune podatke o platnim karticama korisnika.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          6. Recenzije
        </h2>

        <p>
          Recenzije mogu ostavljati samo korisnici koji su imali dovršenu rezervaciju.
        </p>

        <ul className="list-disc pl-6 space-y-1">
          <li>zabranjene su lažne recenzije</li>
          <li>nije dopušten govor mržnje ili uvredljiv sadržaj</li>
          <li>nije dopuštena manipulacija ocjenama</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          7. Zabranjena uporaba
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>nezakonito korištenje Platforme</li>
          <li>unošenje lažnih podataka</li>
          <li>pokušaj neovlaštenog pristupa sustavu</li>
          <li>ometanje rada Platforme</li>
          <li>zaobilaženje sigurnosnih mjera</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          8. Dostupnost Platforme
        </h2>

        <p>
          Nastojimo održavati Platformu dostupnom i funkcionalnom,
          ali ne jamčimo neprekidan rad bez grešaka ili prekida.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          9. Ograničenje odgovornosti
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>ne jamčimo uspješno izvršenje svake rezervacije</li>
          <li>ne odgovaramo za kvalitetu usluge profesionalca</li>
          <li>ne odgovaramo za neizravnu štetu nastalu korištenjem Platforme</li>
        </ul>

        <h2 className="text-2xl font-semibold pt-4">
          10. Intelektualno vlasništvo
        </h2>

        <p>
          Sav sadržaj Platforme pripada nama ili našim licencodavcima,
          osim sadržaja korisnika.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          11. Privatnost
        </h2>

        <p>
          Obrada osobnih podataka uređena je Pravilima privatnosti Platforme.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          12. Prestanak korištenja
        </h2>

        <p>
          Možemo ograničiti ili ukinuti pristup Platformi korisniku
          koji krši pravila ili zakon.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          13. Izmjene Uvjeta
        </h2>

        <p>
          Zadržavamo pravo izmjene ovih Uvjeta u bilo kojem trenutku.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          14. Mjerodavno pravo i nadležnost
        </h2>

        <p>
          Primjenjuje se pravo Republike Hrvatske i Europske unije kada je primjenjivo.
        </p>

        <h2 className="text-2xl font-semibold pt-4">
          15. Kontakt
        </h2>

        <p>
          support@solvix.hr
        </p>
      </div>
    </div>
  );
}
