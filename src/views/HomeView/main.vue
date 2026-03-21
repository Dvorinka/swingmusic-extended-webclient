<template>
    <div class="homepageview content-page">
        <GenericHeader>
            <template #name>Home</template>
            <template #description>{{ getGreetings(auth.user.username) }}</template>
        </GenericHeader>
        <Browse />

        <section v-if="home.recommendedArtists.length" class="recommended-artists">
            <div class="rec-head">
                <h2>Recommended Artists</h2>
                <p>Discover global artists picked for your profile</p>
            </div>
            <div class="artist-grid">
                <RouterLink
                    v-for="artist in home.recommendedArtists.slice(0, 12)"
                    :key="artist.spotify_id || artist.name || artist.title"
                    class="artist-card rounded-sm"
                    :to="resolveRecommendedArtistRoute(artist)"
                >
                    <img
                        :src="artist.image_url || '/icons/artist-placeholder.svg'"
                        :alt="artist.title || artist.name || 'Artist'"
                        @error="onRecommendedImageError"
                    />
                    <div class="name">{{ artist.title || artist.name }}</div>
                </RouterLink>
            </div>
        </section>

        <PageItem
            v-for="item in home.homepageItems"
            :key="item.path"
            :title="item.title || ''"
            :description="item.description"
            :items="item.items"
            :play-source="playSources.mix"
            :route="item.path"
            :see-all-text="item.seeAllText"
        />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import useAuth from '@/stores/auth'

import { playSources } from '@/enums'
import { updateCardWidth } from '@/stores/content-width'
import useHome from '@/stores/home'
import updatePageTitle from '@/utils/updatePageTitle'

import Browse from '@/components/HomeView/Browse.vue'
import PageItem from '@/components/shared/CardScroller.vue'
import GenericHeader from '@/components/shared/GenericHeader.vue'

const home = useHome()
const auth = useAuth()

function onRecommendedImageError(event: Event) {
    const target = event.target as HTMLImageElement | null
    if (target) {
        target.src = '/icons/artist-placeholder.svg'
    }
}

function resolveRecommendedArtistRoute(artist: any) {
    const target = artist?.navigation?.target
    if (target?.route && target?.params) {
        return {
            name: target.route,
            params: target.params,
        }
    }

    return {
        name: 'global-artist',
        params: { id: artist.spotify_id },
    }
}

function getGreetings(username: string) {
    username = username ? username : ''

    const date = new Date()
    const hour = date.getHours()

    if (hour <= 3) {
        return 'Hey there night owl'
    } else if (hour <= 5) {
        return 'Hey there early bird'
    } else if (hour <= 12) {
        return 'Good morning ' + username
    } else if (hour <= 17) {
        return 'Good afternoon ' + username
    } else {
        return 'Goooood evening ' + username
    }
}

onMounted(async () => {
    updatePageTitle('Home')
    await home.fetchAll()
    await home.fetchHomeRecommendations()
    await nextTick()
    updateCardWidth()
})
</script>

<style lang="scss">
.homepageview {
    height: 100%;
    overflow: auto;

    .generichead {
        margin-bottom: 0;
    }

    .recommended-artists {
        margin: 1.25rem 0;
        padding: 0 $small;

        .rec-head {
            margin-bottom: 0.6rem;

            h2 {
                margin: 0;
                font-size: 1.2rem;
            }

            p {
                margin: 0.2rem 0 0;
                color: $gray2;
                font-size: 0.88rem;
            }
        }

        .artist-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
            gap: 0.85rem;
        }

        .artist-card {
            border: 1px solid $gray5;
            background: $gray;
            color: $white;
            padding: 0.45rem;
            transition: background-color 0.2s ease-out;

            img {
                width: 100%;
                aspect-ratio: 1;
                object-fit: cover;
                border-radius: 0.4rem;
                margin-bottom: 0.45rem;
            }

            .name {
                font-size: 0.85rem;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            &:hover {
                background: $gray5;
            }
        }
    }
}
</style>
