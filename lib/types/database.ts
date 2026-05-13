// Hand-crafted to match `supabase gen types typescript`. Once a local
// Supabase instance is running, regenerate this file with:
//   supabase gen types typescript --local > lib/types/database.ts
// or against production:
//   supabase gen types typescript --project-id <ref> > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// --------------------------------------------------------------------
// Typed unions mirroring CHECK constraints in the schema. Match these
// exactly when adding values in SQL.
// --------------------------------------------------------------------

export type SpaceType = "raised_bed" | "in_ground" | "container" | "vertical";

export type ExperienceLevel = "first_year" | "some_seasons" | "experienced";

export type PlantType =
  | "leafy_green"
  | "fruiting"
  | "root"
  | "herb"
  | "legume"
  | "allium"
  | "brassica"
  | "vine";

export type PlantingMethod = "seed" | "seedling" | "transplant";

export type PlantingStatus = "active" | "harvested" | "failed" | "removed";

export type LogType =
  | "water"
  | "harvest"
  | "observation"
  | "pest"
  | "weather_event";

export type CoachFeedback = "helpful" | "wrong" | "partial";

// --------------------------------------------------------------------
// Database schema
// --------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          hardiness_zone: string | null;
          last_frost_date: string | null;
          first_frost_date: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          hardiness_zone?: string | null;
          last_frost_date?: string | null;
          first_frost_date?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          hardiness_zone?: string | null;
          last_frost_date?: string | null;
          first_frost_date?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      spaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: SpaceType;
          width_inches: number;
          length_inches: number;
          sunlight_hours: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: SpaceType;
          width_inches: number;
          length_inches: number;
          sunlight_hours?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: SpaceType;
          width_inches?: number;
          length_inches?: number;
          sunlight_hours?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spaces_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      preferences: {
        Row: {
          user_id: string;
          loves_eating: string[] | null;
          dislikes: string[] | null;
          already_have: string[] | null;
          goals: string[] | null;
          experience_level: ExperienceLevel | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          loves_eating?: string[] | null;
          dislikes?: string[] | null;
          already_have?: string[] | null;
          goals?: string[] | null;
          experience_level?: ExperienceLevel | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          loves_eating?: string[] | null;
          dislikes?: string[] | null;
          already_have?: string[] | null;
          goals?: string[] | null;
          experience_level?: ExperienceLevel | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plants: {
        Row: {
          id: string;
          common_name: string;
          scientific_name: string | null;
          type: PlantType;
          category: string | null;
          days_to_maturity_min: number | null;
          days_to_maturity_max: number | null;
          sunlight_min_hours: number | null;
          spacing_inches: number | null;
          companion_plants: string[] | null;
          antagonist_plants: string[] | null;
          hardiness_zones: string[] | null;
          start_indoor_weeks_before_last_frost: number | null;
          direct_sow_weeks_relative_to_last_frost: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          common_name: string;
          scientific_name?: string | null;
          type: PlantType;
          category?: string | null;
          days_to_maturity_min?: number | null;
          days_to_maturity_max?: number | null;
          sunlight_min_hours?: number | null;
          spacing_inches?: number | null;
          companion_plants?: string[] | null;
          antagonist_plants?: string[] | null;
          hardiness_zones?: string[] | null;
          start_indoor_weeks_before_last_frost?: number | null;
          direct_sow_weeks_relative_to_last_frost?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          common_name?: string;
          scientific_name?: string | null;
          type?: PlantType;
          category?: string | null;
          days_to_maturity_min?: number | null;
          days_to_maturity_max?: number | null;
          sunlight_min_hours?: number | null;
          spacing_inches?: number | null;
          companion_plants?: string[] | null;
          antagonist_plants?: string[] | null;
          hardiness_zones?: string[] | null;
          start_indoor_weeks_before_last_frost?: number | null;
          direct_sow_weeks_relative_to_last_frost?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      plantings: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          space_id: string | null;
          variety: string | null;
          planted_date: string;
          planting_method: PlantingMethod | null;
          position_x: number | null;
          position_y: number | null;
          status: PlantingStatus;
          failure_reason: string | null;
          notes: string | null;
          last_activity_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plant_id: string;
          space_id?: string | null;
          variety?: string | null;
          planted_date: string;
          planting_method?: PlantingMethod | null;
          position_x?: number | null;
          position_y?: number | null;
          status?: PlantingStatus;
          failure_reason?: string | null;
          notes?: string | null;
          last_activity_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plant_id?: string;
          space_id?: string | null;
          variety?: string | null;
          planted_date?: string;
          planting_method?: PlantingMethod | null;
          position_x?: number | null;
          position_y?: number | null;
          status?: PlantingStatus;
          failure_reason?: string | null;
          notes?: string | null;
          last_activity_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plantings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plantings_plant_id_fkey";
            columns: ["plant_id"];
            isOneToOne: false;
            referencedRelation: "plants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plantings_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      logs: {
        Row: {
          id: string;
          user_id: string;
          planting_id: string | null;
          space_id: string | null;
          type: LogType;
          logged_at: string;
          amount_oz: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          planting_id?: string | null;
          space_id?: string | null;
          type: LogType;
          logged_at?: string;
          amount_oz?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          planting_id?: string | null;
          space_id?: string | null;
          type?: LogType;
          logged_at?: string;
          amount_oz?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_planting_id_fkey";
            columns: ["planting_id"];
            isOneToOne: false;
            referencedRelation: "plantings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_zones: {
        Row: {
          zipcode: string;
          zone: string;
          temperature_range: string | null;
          source: string;
          fetched_at: string;
        };
        Insert: {
          zipcode: string;
          zone: string;
          temperature_range?: string | null;
          source?: string;
          fetched_at?: string;
        };
        Update: {
          zipcode?: string;
          zone?: string;
          temperature_range?: string | null;
          source?: string;
          fetched_at?: string;
        };
        Relationships: [];
      };
      coach_sessions: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          response: string;
          tools_used: string[] | null;
          user_feedback: CoachFeedback | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          response: string;
          tools_used?: string[] | null;
          user_feedback?: CoachFeedback | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          response?: string;
          tools_used?: string[] | null;
          user_feedback?: CoachFeedback | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// --------------------------------------------------------------------
// Row / Insert / Update convenience exports
// --------------------------------------------------------------------

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type Space = Tables<"spaces">;
export type SpaceInsert = TablesInsert<"spaces">;
export type SpaceUpdate = TablesUpdate<"spaces">;

export type Preferences = Tables<"preferences">;
export type PreferencesInsert = TablesInsert<"preferences">;
export type PreferencesUpdate = TablesUpdate<"preferences">;

export type Plant = Tables<"plants">;
export type PlantInsert = TablesInsert<"plants">;
export type PlantUpdate = TablesUpdate<"plants">;

export type Planting = Tables<"plantings">;
export type PlantingInsert = TablesInsert<"plantings">;
export type PlantingUpdate = TablesUpdate<"plantings">;

export type Log = Tables<"logs">;
export type LogInsert = TablesInsert<"logs">;
export type LogUpdate = TablesUpdate<"logs">;

export type CoachSession = Tables<"coach_sessions">;
export type CoachSessionInsert = TablesInsert<"coach_sessions">;
export type CoachSessionUpdate = TablesUpdate<"coach_sessions">;

// --------------------------------------------------------------------
// Joined-query result shapes
// --------------------------------------------------------------------

export type PlantingWithPlant = Planting & {
  plant: Plant;
};

export type PlantingWithPlantAndSpace = Planting & {
  plant: Plant;
  space: Space | null;
};

export type LogWithPlanting = Log & {
  planting: (Planting & { plant: Plant }) | null;
};
