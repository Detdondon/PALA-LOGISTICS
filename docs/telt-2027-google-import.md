# Manuel import fra Telt 2027 (PALA)

PALA importerer kun kunder, ordrebeskrivelser, datoer og logistiske kontaktoplysninger fra Google Sheet-fanen **Telt 2027**. Google-arket er altid skrivebeskyttet; økonomiske kolonner (pris, depositum, faktura) læses ikke ind.

## Første opsætning

1. I [Google Cloud Console](https://console.cloud.google.com/apis/credentials) opret eller vælg et Google Cloud-projekt, og aktivér **Google Sheets API**.
2. Opsæt OAuth-consent screen for et Web application OAuth 2.0 Client ID. Tilføj **https://detdondon.github.io** under Authorized JavaScript origins. Vælg de testbrugere, der skal have adgang, hvis OAuth-appen er i testing mode.
3. I PALA skal en administrator åbne **Appindstillinger → Import: Telt 2027**, indsætte det offentlige **OAuth Client ID** (ikke et client secret) og trykke **Gem Google-forbindelse**.
4. Tryk **Importér seneste opdateringer fra Google Sheets**, vælg Google-kontoen med læseadgang til arket, og godkend kun **spreadsheets.readonly**. Fremtidige importer sker manuelt med samme knap.

## Datoer og dubletter

- Rækker med dato oprettes som **Forespørgsel** på de angivne datoer.
- Hvis datoen mangler, oprettes en foreløbig kalenderordre den 1. i den pågældende måned med titlen **[Dato ikke bekræftet]**. Den står også under **Afventer godkendelse** i administratormenuen. Her kan en administrator bekræfte perioden uden at ændre Google-arket.
- Importen matcher eksisterende kilderækker og opretter ikke den samme række flere gange. Hvis mange kunder pludselig flytter kilderække, stopper importen sikkert, så data kan kontrolleres.
- Forespørgsler, som allerede er ændret manuelt i PALA, bliver ikke overskrevet ukritisk ved senere importer.

**OBS:** OAuth-klient-id'et gemmes lokalt i administratorens browser. Der gemmes ikke Google-adgangstokens i Supabase eller PALA. Ved nye enheder skal det offentlige klient-id indtastes igen.
