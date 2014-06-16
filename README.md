JS News: Client by [Michał Budzyński](https://github.com/michalbe)
=============

[JS News](https://www.facebook.com/groups/217169631654737/) is a Polish JavaScript group on Facebook, created by [Damian Wielgosik](https://twitter.com/varjs) & [Kamil Trebunia](https://twitter.com/KamilTrebunia). With 2,100+ active users it's best place in Polish internet to discuss everything related to Fronend development. And since it's mostly (only?) for Polish speaking developers, rest of this README will be in PL.

---
### Co? ###
JS News: Client to oparty na node.js, commandlineowy klient do Waszej ulubionej fejsbukowej grupy - [JS News](https://www.facebook.com/groups/217169631654737/) . Umożliwia on przeglądanie postów i komentarzy bez uruchamiania przeglądarki, oraz informuje w czasie rzeczywistym o updatach (wykorzystując [Growl](http://growl.info/)).
![Growl notification](static/jsnewsgrowl.jpg)

### Jak? ###
Aby uruchomić JS News: Client potrzeba:
  *  Stworzyć swój plik `config.js` w katalogu `/src/`. Można wykorzystać do tego plik `config.js.example` zamieszczony w tym samym katalogu.
  *  Do poprawnego działania potrzebujemy facebookowe klucze - prywatny i publiczny. Przepraszam, ale nie chciało mi się bawić w serwerowe zagadnienia (nie udaję nawet że umiem), najprościej więc będzie stworzyć nową aplikację [TUTAJ](https://developers.facebook.com/), następnie `APPS` -> `Create New` i wygenerować dla niej klucze (całość powinna trwać około 2.5 sec)
  ![Facebookowe klucze](static/keys.jpg)
  *  Dependencje `npm`. W katalogu głównym aplikacji odpalamy `npm install`.
  *  Jeśli nie mamy `Growla` lub `MacOsXa`, czytamy tutaj: [https://github.com/visionmedia/node-growl#install](https://github.com/visionmedia/node-growl#install)
  *  Uruchamiamy z linii komend poprzez `node index.js`
  *  Cieszymy się, bawimy i radujemy.

### Czemu? ###
Czy jesteś znudzony łumaczeniem swoim współpracownikom i przełożonym że większość czasu na Facebooku spędzasz dyskutując o JavaScriptowych problemach, rozwiązaniach, projektach i pomysłach. Robiąc to samo w terminalu cały czas wyglądasz jakbyś pracował :)!
![lista tematów](static/jsnewslista.jpg)

### Co dalej? ###
Wiele jeszcze zostało do zrobienia, m.in.:
  *  Komentowanie z poziomu clienta
  *  Lajkowanie (postów i komentarzy)
  *  Wiecej mówiące updaty (nie tylko 'Update!', bardziej w stylu 'XYZ dodał komentarz do postu ABC')
  *  Otwieranie załączonych do postów i komentarzy linków bezpośrednio z aplikacji
  *  Obsługa siostrzanych grup:
    * JS News: After Hours
    * JS News: Jobs (`if (content.innerHTML.indexOf('widełki') === -1) content.classList.add('hide')`)
    * (obydwa przewidziane są już w testowym configu)
  *  Schematy kolorystyczne zmieniane z configu (wiem że nie każdy ma ciemne tło w terminalu)
  *  I pewnie krocie innych pomysłów.

Jeśli masz czas i chęć rozwijać projekt, zapraszam (**dla każdego kto wyląduje rozsądny Pull Request w `masterze` darmowy bilet na tegorocznych [onGameStart](http://onGameStart)**)

![Szczegóły postu](static/jsnews-detail.jpg)
