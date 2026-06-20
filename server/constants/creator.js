const CREATOR_CONTENT_TYPES = [
  'youtube_video',
  'youtube_short',
  'instagram_reel',
  'facebook_video',
  'facebook_reel',
];

const CREATOR_REWARD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const CREATOR_REWARD_STATUS_ARRAY = Object.values(CREATOR_REWARD_STATUS);

module.exports = {
  CREATOR_CONTENT_TYPES,
  CREATOR_REWARD_STATUS,
  CREATOR_REWARD_STATUS_ARRAY,
};
