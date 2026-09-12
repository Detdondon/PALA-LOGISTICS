# PALA disaster recovery

Denne mappe følger appkoden, så en fuld systembackup også indeholder databaseopsætningen.

## Database

Ved opbygning af et tomt Supabase-projekt anvendes scripts i `database/` i nummerorden. De historiske scripts i `legacy/` er kun med som dokumentation og skal ikke køres oven på de nyere scripts.

Den månedlige ZIP-backup skal derudover indeholde de aktuelle data og alle vedhæftede filer. Data fra backupen skal importeres efter schemaet er oprettet.

## App

Mappen `app-source/` i en eksporteret backup er et snapshot af hele GitHub-repositoryet ved den commit, der står i backupens manifest. Den kan publiceres igen som statisk app.

## Hemmeligheder

Service-role keys, database-passwords og andre serverhemmeligheder må ikke ligge i en browsergenereret backup. De skal oprettes/roteres på den nye platform. Den publicerbare Supabase-konfiguration findes allerede i appkoden.

## Kontrol

En recovery-backup må kun betegnes som komplet, når manifestet ikke indeholder kritiske eksportfejl. Aktive sessions/tokens er sikkerhedscredentials og bør normalt ikke genbruges efter en katastrofegendannelse; medarbejdernes varige loginoplysninger skal derimod kunne rekonstrueres fra den beskyttede databaseeksport.
