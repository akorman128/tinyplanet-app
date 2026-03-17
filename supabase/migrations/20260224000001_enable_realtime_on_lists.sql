-- Enable Supabase Realtime on the lists table so postgres_changes subscriptions receive events
ALTER PUBLICATION supabase_realtime ADD TABLE lists;
