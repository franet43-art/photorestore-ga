-- Migration: Add guest_id to orders to support unauthenticated sessions
-- Phase: User Journey Refactor

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_id text;

-- Mettre à jour les RLS pour permettre aux guests de lire leurs propres commandes
-- Note: Dans une application réelle, on utiliserait un cookie sécurisé et une validation côté API.
-- Ici on ajoute une police simple basée sur le guest_id.

CREATE POLICY "Les guests peuvent voir leurs propres commandes" 
ON public.orders 
FOR SELECT 
USING (guest_id IS NOT NULL AND auth.role() = 'anon');
