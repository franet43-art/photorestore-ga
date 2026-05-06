# Checklist de déploiement PhotoRestore.ga

## Variables d'environnement Vercel (toutes obligatoires)
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] GOOGLE_AI_API_KEY
- [ ] CHARIOW_LINK_RESULT1_STANDARD
- [ ] CHARIOW_LINK_RESULT2_STANDARD
- [ ] CHARIOW_LINK_RESULT1_COLOR
- [ ] CHARIOW_LINK_RESULT2_COLOR
- [ ] NEXT_PUBLIC_APP_URL (= https://photorestore.ga)
- [ ] CRON_SECRET (chaîne aléatoire longue)

## Supabase
- [ ] Buckets créés : uploads (private), previews (public), outputs (private)
- [ ] Migration SQL exécutée (001_initial_schema.sql)
- [ ] Auth magic link activé
- [ ] URL de redirection auth autorisée : https://photorestore.ga/auth/confirm

## Chariow
- [ ] 4 produits créés dans le dashboard
- [ ] URLs de liens directs copiées dans les variables d'env
- [ ] URL de retour configurée : https://photorestore.ga/success?order=...

## Cron
- [ ] UptimeRobot ou Vercel Cron configuré sur /api/cron/cleanup

## Tests pre-launch
- [ ] Test flux complet : upload → restauration IA → preview → paiement test → téléchargement
- [ ] Test magic link sur mobile
- [ ] Test upload sur mobile (marché principal)
- [ ] Test page admin (changer un statut en paid)
- [ ] Vérifier que les images HD ne sont pas accessibles sans lien signé

## Sécurité
- [ ] GOOGLE_AI_API_KEY non exposée côté client (vérifier dans DevTools)
- [ ] SUPABASE_SERVICE_ROLE_KEY non exposée côté client
- [ ] Buckets outputs et uploads bien en mode private
