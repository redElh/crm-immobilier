const BUFFER_API = 'https://api.buffer.com';

class BufferService {
  constructor() {
    this.apiKey = process.env.CRM_SQUARE_IMMO_BUFFER || '';
    this._orgId = null;
  }

  async _graphql(query, variables = {}) {
    const response = await fetch(BUFFER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    const result = await response.json();
    if (result.errors) {
      const msgs = result.errors.map(e => e.message).join('; ');
      throw new Error(`Buffer API error: ${msgs}`);
    }
    return result.data;
  }

  async _getOrganizationId() {
    if (this._orgId) return this._orgId;
    const data = await this._graphql(`
      query GetOrganizations {
        account {
          organizations { id name }
        }
      }
    `);
    const orgs = data?.account?.organizations;
    if (!orgs || orgs.length === 0) {
      throw new Error('No Buffer organization found');
    }
    this._orgId = orgs[0].id;
    return this._orgId;
  }

  async getProfiles() {
    const orgId = await this._getOrganizationId();
    const data = await this._graphql(`
      query GetChannels($orgId: OrganizationId!) {
        channels(input: { organizationId: $orgId }) {
          id
          name
          displayName
          service
          avatar
          isQueuePaused
          isDisconnected
        }
      }
    `, { orgId });
    return (data?.channels || []).map(ch => ({
      id: ch.id,
      platform: ch.service,
      label: ch.displayName || ch.name,
      avatar: ch.avatar,
      profileName: ch.name,
      profileId: ch.id,
      connected: !ch.isDisconnected,
      status: ch.isDisconnected ? 'disconnected' : 'connected',
    }));
  }

  async createUpdate({ profileIds, text, mediaUrls, scheduledAt, postType, platform }) {
    const channelId = profileIds[0];

    const metadata = {};
    if (postType && platform === 'facebook') {
      metadata.facebook = { type: postType };
    } else if (postType && platform === 'instagram') {
      metadata.instagram = { type: postType };
    }

    const variables = {
      input: {
        channelId,
        text,
        schedulingType: 'automatic',
        mode: scheduledAt ? 'customScheduled' : 'shareNow',
      },
    };

    if (Object.keys(metadata).length > 0) {
      variables.input.metadata = metadata;
    }

    if (scheduledAt) {
      variables.input.dueAt = scheduledAt;
    }

    if (mediaUrls && mediaUrls.length > 0) {
      const publicUrl = process.env.FRONTEND_URL || process.env.BACKEND_URL || 'http://localhost:5000';
      const reachableUrls = mediaUrls.filter(url => {
        if (!url || url.startsWith('/')) return false;
        try {
          const parsed = new URL(url);
          return parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1';
        } catch {
          return false;
        }
      });
      if (reachableUrls.length > 0) {
        variables.input.assets = reachableUrls.map(url => ({
          image: { url },
        }));
      }
    }

    const data = await this._graphql(`
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            post { id text status dueAt sentAt }
          }
          ... on MutationError { message }
        }
      }
    `, variables);

    const result = data?.createPost;
    if (result?.message) {
      throw new Error(`Buffer create post error: ${result.message}`);
    }
    return result?.post || result;
  }

  async getUpdate(updateId) {
    const data = await this._graphql(`
      query GetPost($input: PostInput!) {
        post(input: $input) {
          id
          text
          status
          dueAt
          sentAt
          channelId
          channelService
          metrics {
            type
            name
            value
          }
        }
      }
    `, { input: { id: updateId } });
    return data?.post;
  }

  async getProfileUpdates(profileId, { limit = 20, status } = {}) {
    const orgId = await this._getOrganizationId();
    const variables = {
      input: { organizationId: orgId, channelId: profileId },
      first: limit,
    };
    const data = await this._graphql(`
      query GetPosts($input: PostsInput!, $first: Int) {
        posts(input: $input, first: $first) {
          edges {
            node {
              id text status dueAt sentAt channelId
            }
            cursor
          }
        }
      }
    `, variables);
    return data?.posts?.edges?.map(e => e.node) || [];
  }
}

export default new BufferService();
