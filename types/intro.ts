// ============ DATA MODELS ============

export interface Intro {
  id: string;
  introducer_id: string;
  user_id_a: string;
  user_id_b: string;
  message: string;
  created_at: string;
}

export interface IntroWithIntroducer extends Intro {
  introducer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// ============ INPUT DTOS ============

export interface CreateIntroInput {
  userAId: string;
  userBId: string;
  message: string;
}

// ============ OUTPUT DTOS ============

export interface GetIntroOutput {
  data: IntroWithIntroducer | null;
}
