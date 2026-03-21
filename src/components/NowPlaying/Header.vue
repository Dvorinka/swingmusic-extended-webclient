<template>
    <div class="now-playing-header">
        <!-- Exit button for fullscreen mode -->
        <button class="exit-fullscreen" title="Exit Fullscreen" @click="exitFullscreen">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 9l6 6M15 9l-6 6"/>
            </svg>
        </button>
        
        <div class="fullscreen-player">
            <!-- Background artwork with blur effect -->
            <div class="background-artwork">
                <img :src="paths.images.thumb.large + queue.currenttrack?.image" />
            </div>
            
            <!-- Main content -->
            <div class="main-content">
                <!-- Large artwork -->
                <div class="artwork-container">
                    <RouterLink
                        :to="{
                            name: Routes.album,
                            params: {
                                albumhash: queue.currenttrack?.albumhash || ' ',
                            },
                        }"
                        title="Go to Album"
                        class="np-artwork"
                    >
                        <img v-motion-fade class="artwork-image" :src="paths.images.thumb.large + queue.currenttrack?.image" />
                    </RouterLink>
                </div>
                
                <!-- Track info and controls -->
                <div class="info-section">
                    <PlayingFrom />
                    <NowPlayingInfo @handle-fav="handleFav" />
                    
                    <!-- Large progress bar -->
                    <div class="progress-section">
                        <Progress />
                        <div class="time-display">
                            <span class="time-current">{{ formatSeconds(queue.duration.current) }}</span>
                            <span class="time-total">{{ formatSeconds(queue.duration.full) }}</span>
                        </div>
                    </div>
                    
                    <!-- Playback controls -->
                    <div class="controls-section">
                        <Buttons v-if="!isMobile" :hide-heart="true" @handleFav="() => {}" />
                        <Buttons v-else :hide-heart="true" @handleFav="() => {}" />
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Queue section -->
        <div class="queue-section">
            <h3 v-if="queue.next" class="nowplaying_title">Up Next</h3>
            <SongItem
                v-if="queue.next"
                :track="queue.next"
                :index="queue.nextindex + 1"
                :source="dropSources.folder"
                @play-this="queue.playNext"
            />
            <h3 class="nowplaying_title">Queue</h3>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { paths } from '@/config'
import { dropSources, favType } from '@/enums'
import favoriteHandler from '@/helpers/favoriteHandler'
import { Routes } from '@/router'
import { isMobile, isSmallPhone } from '@/stores/content-width'
import useQueueStore from '@/stores/queue'
import { formatSeconds } from '@/utils'

import Progress from '@/components/LeftSidebar/NP/Progress.vue'
import Buttons from '../BottomBar/Right.vue'
import SongItem from '../shared/SongItem.vue'
import NowPlayingInfo from './NowPlayingInfo.vue'
import PlayingFrom from './PlayingFrom.vue'

const router = useRouter();
const queue = useQueueStore()

function handleFav() {
    favoriteHandler(
        queue.currenttrack?.is_favorite,
        favType.track,
        queue.currenttrack?.trackhash || '',
        () => null,
        () => null
    )
}

function exitFullscreen() {
    // Go back to the previous page
    router.go(-1);
}
</script>

<style lang="scss">
.now-playing-view.isSmall .now-playing-header .nowplaying_title {
    padding-left: 0.5rem;
}

.now-playing-header {
    padding-bottom: $smaller;
    position: relative;

    // Exit fullscreen button
    .exit-fullscreen {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 10000;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 3rem;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;

        &:hover {
            background-color: rgba(0, 0, 0, 0.9);
            border-color: rgba(255, 255, 255, 0.4);
            transform: scale(1.1);
        }

        svg {
            width: 1.2rem;
            height: 1.2rem;
        }
    }

    .nowplaying_title {
        padding-left: 1rem;
        margin: 1.25rem 0;

        &:last-child {
            padding-top: $large;
            margin: 1rem 0;
        }

        @media only screen and (max-width: 724px) {
            padding-left: 0.5rem;
        }
    }

    // Enhanced fullscreen player
    .fullscreen-player {
        position: relative;
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 2rem;
        overflow: hidden;

        .background-artwork {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: -1;
            overflow: hidden;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: blur(40px) brightness(0.4);
                transform: scale(1.1);
                transition: transform 0.3s ease;
            }
        }

        .main-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
            max-width: 100%;
            z-index: 1;

            @media (min-width: 768px) {
                flex-direction: row;
                gap: 4rem;
                max-width: 1200px;
            }
        }

        .artwork-container {
            flex-shrink: 0;

            .np-artwork {
                display: block;
                text-decoration: none;
                border-radius: 1rem;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                transition: transform 0.3s ease, box-shadow 0.3s ease;

                &:hover {
                    transform: scale(1.02);
                    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);
                }

                .artwork-image {
                    width: 20rem;
                    height: 20rem;
                    object-fit: cover;
                    display: block;

                    @media (min-width: 768px) {
                        width: 24rem;
                        height: 24rem;
                    }

                    @media (min-width: 1024px) {
                        width: 28rem;
                        height: 28rem;
                    }
                }
            }
        }

        .info-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            text-align: center;
            color: white;
            max-width: 100%;

            @media (min-width: 768px) {
                align-items: flex-start;
                text-align: left;
                max-width: 500px;
            }

            :deep(.now-playing-info) {
                .title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.5rem;
                    line-height: 1.2;

                    @media (min-width: 768px) {
                        font-size: 2rem;
                    }
                }

                .artist {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 1rem;

                    @media (min-width: 768px) {
                        font-size: 1.1rem;
                    }
                }

                .actions {
                    .optionsvg {
                        color: white;
                        background-color: rgba(255, 255, 255, 0.1);
                        
                        &:hover {
                            background-color: rgba(255, 255, 255, 0.2);
                        }
                    }

                    .heart-button {
                        background-color: rgba(255, 255, 255, 0.1);
                        
                        &:hover {
                            background-color: rgba(255, 255, 255, 0.2);
                        }
                    }
                }
            }

            :deep(.playing-from) {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9rem;
                margin-bottom: 1rem;
            }

            .progress-section {
                width: 100%;
                max-width: 400px;

                #progress {
                    width: 100%;
                    height: 6px;
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                    outline: none;

                    &::-moz-range-thumb {
                        height: 1rem;
                        width: 1rem;
                        background-color: white;
                        border-radius: 50%;
                        cursor: pointer;
                        border: none;
                    }

                    &::-webkit-slider-thumb {
                        height: 1rem;
                        width: 1rem;
                        background-color: white;
                        border-radius: 50%;
                        cursor: pointer;
                        border: none;
                        appearance: none;
                    }

                    &::-ms-thumb {
                        height: 1rem;
                        width: 1rem;
                        background-color: white;
                        border-radius: 50%;
                        cursor: pointer;
                        border: none;
                    }
                }

                .time-display {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.5rem;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.8);
                    font-variant-numeric: tabular-nums;
                }
            }

            .controls-section {
                :deep(.right-group) {
                    button {
                        background-color: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: white;
                        width: 3.5rem;
                        height: 3.5rem;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;

                        &:hover {
                            background-color: rgba(255, 255, 255, 0.2);
                            border-color: rgba(255, 255, 255, 0.3);
                            transform: scale(1.05);
                        }

                        &:nth-child(2) {
                            width: 4rem;
                            height: 4rem;
                            background-color: white;
                            color: black;

                            &:hover {
                                background-color: rgba(255, 255, 255, 0.9);
                            }
                        }

                        svg {
                            transform: scale(1.2);
                        }
                    }
                }
            }
        }

        @media (max-width: 767px) {
            min-height: 60vh;
            padding: 1rem;

            .artwork-container .np-artwork .artwork-image {
                width: 16rem;
                height: 16rem;
            }

            .info-section {
                gap: 1rem;

                :deep(.now-playing-info) .title {
                    font-size: 1.3rem;
                }
            }
        }
    }

    .queue-section {
        margin-top: 2rem;
        padding: 0 1rem;
    }
}

// Keep original styles for compatibility
.below-progress {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;

    .time {
        font-size: $medium;
        font-weight: 500;
        background-color: $gray3;
        padding: 1px $smaller;
        min-width: 2.5rem;
        text-align: center;
        border-radius: $smaller;
        font-variant-numeric: tabular-nums;
    }

    @include allPhones {
        .right-group button.speaker {
            border-top: 1px solid transparent !important;
            border-top-left-radius: 0 !important;
            border-top-right-radius: 0 !important;
        }
    }

    @include smallestPhones {
        position: relative;
        flex-direction: column;
        align-items: unset;
        gap: $small;

        .time:first-child {
            align-self: baseline;
            margin-left: 4px;
        }

        .time:last-child {
            align-self: end;
            position: absolute;
            top: 0;
            right: 4px;
        }

        .right-group {
            width: 100% !important;
            display: flex;
            justify-content: space-between;
        }
    }
}

.centered {
    margin: 0 auto;
    width: 26rem;
    max-width: 100%;
}

.np-image {
    position: relative;
    margin-bottom: 1rem;

    img {
        width: 100%;
        height: 100%;
        max-width: 30rem;
        object-fit: cover;
    }
}

#progress {
    margin-top: 1rem;
    margin-right: 0;

    &::-moz-range-thumb {
        height: 0.8rem;
    }

    &::-webkit-slider-thumb {
        height: 0.8rem;
    }

    &::-ms-thumb {
        height: 0.8rem;
    }
}
</style>