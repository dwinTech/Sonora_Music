<template>
  <q-page class="sonora-page" :class="{ 'sonora-light': !darkMode, 'mobile-nav-open': sidebarOpen, 'sidebar-collapsed': !sidebarOpen }">
    <section v-if="!libraryReady" class="library-loading-overlay" role="status">
      <q-spinner v-if="!libraryLoadError" size="32px" />
      <q-icon v-else name="cloud_off" size="32px" />
      <strong>{{ libraryLoadError ? 'Could not connect to your library' : 'Loading your library...' }}</strong>
      <p v-if="libraryLoadError">{{ libraryLoadError }}</p>
      <button v-if="libraryLoadError" class="outline-button" :disabled="libraryLoading" @click="loadLibrary">
        <q-spinner v-if="libraryLoading" size="16px" />
        <span v-else>Try again</span>
      </button>
    </section>

    <!-- Full-width header -->
    <header class="topbar yt-topbar">
      <div class="topbar-start">
        <button
          class="yt-burger-btn"
          :aria-label="sidebarOpen ? 'Close navigation' : 'Open navigation'"
          aria-controls="sonora-sidebar"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = !sidebarOpen"
        >
          <q-icon name="menu" />
        </button>
        <button class="ytm-brand" aria-label="Sonora Music home" @click="setView('Home')">
          <div class="ytm-logo-badge light-green-badge">
            <q-icon name="play_arrow" />
          </div>
          <div class="ytm-brand-label">
            <span class="ytm-brand-name">sonora</span>
            <span class="ytm-brand-sub light-green-sub">Music</span>
          </div>
        </button>
      </div>
      <div class="topbar-center">
        <label class="global-search yt-search-bar">
          <q-icon name="search" class="yt-search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search songs, albums, artists, podcasts"
            aria-label="Search songs, albums, artists, podcasts"
            @focus="openSearch"
          />
          <button v-if="searchQuery" class="yt-clear-btn" aria-label="Clear search" @click.prevent="searchQuery = ''">
            <q-icon name="close" />
          </button>
        </label>
      </div>
      <div class="topbar-tools">
        <button class="icon-utility yt-topbar-btn" aria-label="Cast to device"><q-icon name="cast" /></button>
        <button class="icon-utility yt-topbar-btn" :aria-label="darkMode ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme"><q-icon :name="darkMode ? 'light_mode' : 'dark_mode'" /></button>
        <button class="profile-avatar-btn yt-profile-btn" :aria-label="`Profile: ${props.userEmail}`" @click="profileMenu = !profileMenu">
          <span>{{ props.userEmail.charAt(0).toLocaleUpperCase() || 'A' }}</span>
        </button>
        <div v-if="profileMenu" class="profile-popover yt-topbar-popover">
          <div class="popover-user-row">
            <span class="profile-avatar">{{ props.userEmail.charAt(0).toLocaleUpperCase() || 'A' }}</span>
            <div class="popover-user-info">
              <strong>{{ listenerDisplayName }}</strong>
              <small>{{ props.userEmail }}</small>
            </div>
          </div>
          <div class="yt-nav-divider" />
          <button @click="openTrackDialog(); profileMenu = false"><q-icon name="file_upload" /> Upload music</button>
          <button @click="toggleTheme(); profileMenu = false"><q-icon :name="darkMode ? 'light_mode' : 'dark_mode'" /> {{ darkMode ? 'Light appearance' : 'Dark appearance' }}</button>
          <button @click="$emit('sign-out')"><q-icon name="logout" /> Sign out</button>
        </div>
      </div>
    </header>

    <!-- Main workspace: collapsible sidebar + content -->
    <div class="sonora-body">
      <aside v-if="sidebarOpen" id="sonora-sidebar" class="sonora-sidebar yt-sidebar">
        <nav class="side-navigation yt-navigation" aria-label="Main navigation">
          <div class="yt-nav-group">
            <button
              class="side-link yt-nav-link"
              :class="{ active: activeView === 'Home' }"
              @click="setView('Home')"
            >
              <q-icon name="home" class="yt-nav-icon" />
              <span>Home</span>
            </button>
            <button
              class="side-link yt-nav-link"
              :class="{ active: activeView === 'Explore' }"
              @click="setView('Explore')"
            >
              <q-icon name="explore" class="yt-nav-icon" />
              <span>Explore</span>
            </button>
            <button
              class="side-link yt-nav-link"
              :class="{ active: activeView === 'Your Library' || activeView === 'Library' }"
              @click="setView('Your Library')"
            >
              <q-icon name="collections_bookmark" class="yt-nav-icon" />
              <span>Library</span>
              <span v-if="allLibraryTracks.length" class="side-count">{{ allLibraryTracks.length }}</span>
            </button>
            <button
              class="side-link yt-nav-link"
              @click="upgradeDialogOpen = true"
            >
              <q-icon name="album" class="yt-nav-icon" />
              <span>Upgrade</span>
            </button>
            <button
              class="side-link yt-nav-link"
              :class="{ active: activeView === 'Liked Songs' }"
              @click="setView('Liked Songs')"
            >
              <q-icon name="favorite" class="yt-nav-icon" />
              <span>Liked Songs</span>
              <span v-if="favoriteCount > 0" class="side-count">{{ favoriteCount }}</span>
            </button>
          </div>

          <div class="yt-nav-divider" />

          <div class="yt-create-section">
            <button class="yt-new-playlist-btn" aria-label="New playlist" @click="openNewPlaylist">
              <q-icon name="add" />
              <span>New playlist</span>
            </button>
          </div>

          <div class="side-label side-label-spaced playlist-label">
            <span>PLAYLISTS</span>
          </div>

          <div class="yt-playlists-scroll">
            <div v-if="playlists.length === 0" class="yt-playlist-empty">
              <small>No playlists yet</small>
            </div>
            <div v-for="playlist in playlists" :key="playlist.id" class="folder-nav-item yt-playlist-item">
              <button
                class="side-link playlist-link yt-playlist-link"
                :class="{ active: activeView === playlist.name }"
                @click="setView(playlist.name)"
              >
                <span class="playlist-swatch" :style="{ backgroundImage: `url('${playlist.coverUrl}')` }">
                  <q-icon v-if="!playlist.coverUrl" name="queue_music" />
                </span>
                <span class="yt-playlist-title">{{ playlist.name }}</span>
              </button>
              <q-btn
                flat
                round
                dense
                icon="delete_outline"
                class="folder-delete-button"
                :aria-label="`Delete ${playlist.name} playlist`"
                @click.stop="deletePlaylistById(playlist.id)"
              >
                <q-tooltip>Delete playlist</q-tooltip>
              </q-btn>
            </div>
          </div>
        </nav>
      </aside>
      <button v-if="sidebarOpen" class="sidebar-backdrop" aria-label="Dismiss navigation overlay" @click="sidebarOpen = false" />

      <main class="sonora-content">
        <div class="content-scroll">
          <div class="dashboard-inner">
            <template v-if="activeView === 'Home'">
              <section class="home-listen-again">
                <nav class="home-mood-chips yt-mood-chips" aria-label="Choose a listening mood">
                  <button
                    class="yt-mood-chip"
                    :class="{ active: selectedMood === null }"
                    @click="playHomeMood(null)"
                  >
                    All
                  </button>
                  <button
                    v-for="mood in homeMoods"
                    :key="mood.label"
                    class="yt-mood-chip"
                    :class="{ active: selectedMood === mood.mood }"
                    @click="playHomeMood(mood.mood)"
                  >
                    {{ mood.label }}
                  </button>
                </nav>
                <div class="listen-again-heading">
                  <div class="listener-heading">
                    <span class="listener-avatar">{{ props.userEmail.charAt(0).toLocaleUpperCase() || 'A' }}</span>
                    <div>
                      <p>{{ listenerDisplayName }}</p>
                      <h1>Listen again</h1>
                    </div>
                  </div>
                  <div class="listen-again-controls">
                    <button class="yt-more-pill-btn" @click="setView('Your Library')">More</button>
                    <button class="yt-arrow-btn" aria-label="Scroll tracks left" @click="scrollListenAgain(-1)"><q-icon name="chevron_left" /></button>
                    <button class="yt-arrow-btn" aria-label="Scroll tracks right" @click="scrollListenAgain(1)"><q-icon name="chevron_right" /></button>
                  </div>
                </div>
                <div v-if="homeListenAgainTracks.length" ref="listenAgainRow" class="listen-again-row">
                  <button
                    v-for="track in homeListenAgainTracks"
                    :key="track.id"
                    class="listen-again-card"
                    @click="playTrack(track)"
                  >
                    <span class="listen-again-cover" :style="{ backgroundImage: `url('${track.coverUrl}')` }">
                      <span class="listen-again-play"><q-icon name="play_arrow" /></span>
                    </span>
                    <strong>{{ track.title }}</strong>
                    <small>{{ getArtistDisplayName(track) }}<span v-if="track.album"> · {{ track.album }}</span></small>
                  </button>
                </div>
                <div v-else class="home-listen-empty">
                  <q-icon name="headphones" />
                  <span>Play a few songs and they’ll show up here.</span>
                </div>
              </section>

              <section v-if="homeAlbums.length" class="dashboard-section home-albums-section">
                <div class="section-heading">
                  <div><p class="section-kicker">FROM YOUR COLLECTION</p><h2>Albums &amp; singles</h2></div>
                  <button class="text-link" @click="setView('Your Library')">Your library <q-icon name="arrow_forward" /></button>
                </div>
                <div class="home-album-row">
                  <button
                    v-for="album in homeAlbums"
                    :key="album.name"
                    class="home-album-card"
                    @click="openAlbumSearch(album.name)"
                  >
                    <span class="home-album-cover" :style="{ backgroundImage: `url('${album.coverUrl}')` }">
                      <span class="home-album-play"><q-icon name="play_arrow" /></span>
                    </span>
                    <strong>{{ album.name }}</strong>
                    <small>{{ album.artist || 'Unknown artist' }}</small>
                  </button>
                </div>
              </section>
            </template>

            <section v-if="activeView !== 'Home'" class="greeting-row">
              <div>
                <p class="overline">{{ greetingLabel }}</p>
                <h1>{{ pageTitle }}<span>.</span></h1>
                <p class="greeting-subtitle">Find your rhythm. There’s always something good to listen to.</p>
              </div>
              <span class="date-note">CURATED FOR YOU <i /></span>
            </section>

            <template v-if="activeView === 'Search' || activeView === 'Discover'">
              <section class="hero-feature" :style="{ backgroundImage: `linear-gradient(90deg, rgba(30,27,43,.98) 0%, rgba(40,33,53,.9) 43%, rgba(29,23,39,.12) 100%), url('${heroImage}')` }">
                <div class="hero-copy">
                  <div class="hero-kicker"><span class="kicker-spark">✦</span> FEATURED PLAYLIST</div>
                  <h2>Feel everything.<br /><span>Play anything.</span></h2>
                  <p>A soundtrack for whatever the day brings.</p>
                  <button class="hero-play" @click="playFeatured"><q-icon name="play_arrow" /> Listen now <q-icon name="arrow_forward" /></button>
                </div>
                <div class="hero-pagination"><span class="pagination-active" /> <span /> <span /> <small>01 / 03</small></div>
              </section>

              <section class="dashboard-section recent-section">
                <div class="section-heading">
                  <div><p class="section-kicker">PICK UP WHERE YOU LEFT OFF</p><h2>Recently played</h2></div>
                  <button v-if="recentlyPlayedTracks.length" class="text-link" @click="clearListeningHistory">Clear history</button>
                  <button class="text-link" @click="setView('Library')">See all <q-icon name="arrow_forward" /></button>
                </div>
                <div class="recent-grid">
                  <button v-for="track in recentlyPlayedTracks" :key="track.id" class="recent-item" @click="playTrack(track)">
                    <span class="recent-cover" :style="{ backgroundImage: `url('${track.coverUrl}')` }"><span class="cover-play"><q-icon name="play_arrow" /></span></span>
                    <span class="recent-copy"><strong>{{ track.title }}</strong><small>{{ getArtistDisplayName(track) }}</small></span>
                    <span class="recent-eq" :class="{ 'eq-playing': playingTrack?.id === track.id && isPlaying }"><i /><i /><i /></span>
                  </button>
                </div>
              </section>

              <section class="dashboard-section mood-section">
                <div class="section-heading">
                  <div><p class="section-kicker">JUST FOR YOU</p><h2>Made for your mood</h2></div>
                  <button class="text-link" @click="setView('Browse')">Explore more <q-icon name="arrow_forward" /></button>
                </div>
                <div class="mood-grid">
                  <button v-for="mix in moodMixes" :key="mix.title" class="mood-card" :style="{ backgroundImage: `${mix.shade}, url('${mix.image}')` }" @click="playMood(mix.mood)">
                    <span class="mix-label">{{ mix.label }}</span><strong>{{ mix.title }}</strong><small>{{ mix.caption }}</small>
                    <span class="mix-play"><q-icon name="play_arrow" /></span>
                  </button>
                </div>
              </section>
            </template>

            <section v-if="activeView === 'Home'" class="dashboard-section home-moods-section">
              <div class="section-heading">
                <div><p class="section-kicker">PICK A FEELING</p><h2>Moods &amp; genres</h2></div>
                <button class="text-link" @click="setView('Browse')">Explore all <q-icon name="arrow_forward" /></button>
              </div>
              <div class="mood-grid">
                <button v-for="mix in moodMixes" :key="mix.title" class="mood-card" :style="{ backgroundImage: `${mix.shade}, url('${mix.image}')` }" @click="playMood(mix.mood)">
                  <span class="mix-label">{{ mix.label }}</span><strong>{{ mix.title }}</strong><small>{{ mix.caption }}</small>
                  <span class="mix-play"><q-icon name="play_arrow" /></span>
                </button>
              </div>
            </section>

            <section v-if="activeView === 'Explore'" class="dashboard-section explore-section">
              <div class="section-heading"><div><p class="section-kicker">FRESH FINDS</p><h2>Trending in Sonora</h2></div><button class="text-link" @click="setView('Your Library')">Open your library <q-icon name="arrow_forward" /></button></div>
              <div class="entity-grid">
                <button v-for="track in tracks.slice(0, 6)" :key="track.id" class="entity-card" @click="playTrack(track)">
                  <span class="entity-cover" :style="{ backgroundImage: `url('${track.coverUrl}')` }" />
                  <strong>{{ track.title }}</strong><small>{{ getArtistDisplayName(track) }} · {{ track.genre }}</small>
                </button>
              </div>
              <div class="section-heading explore-subheading"><div><p class="section-kicker">MEET THE ARTISTS</p><h2>Popular artists</h2></div></div>
              <div class="entity-grid">
                <button v-for="artist in artistResults.slice(0, 6)" :key="artist.name" class="entity-card" @click="openArtistSearch(artist.name)">
                  <span class="entity-cover artist-cover" :style="{ backgroundImage: `url('${artist.coverUrl}')` }" />
                  <strong>{{ artist.name }}</strong><small>Artist</small>
                </button>
              </div>
            </section>

            <section class="dashboard-section popular-section">
              <div class="section-heading popular-heading">
                <div><p class="section-kicker">ON EVERYONE’S RADAR</p><h2>{{ collectionHeading }}</h2></div>
                <button v-if="activeView === 'Home' || activeView === 'Search'" class="text-link" @click="setView('Browse')">View all <q-icon name="arrow_forward" /></button>
                <div v-else-if="activePlaylist" class="playlist-header-actions">
                  <button class="outline-button" @click="openPlaylistEditor(activePlaylist)"><q-icon name="edit" /> Edit playlist</button>
                </div>
              </div>
              <nav v-if="activeView === 'Search' || activeView === 'Your Library'" class="collection-tabs" :aria-label="activeView === 'Search' ? 'Search result categories' : 'Library categories'">
                <button v-for="category in collectionCategories" :key="category" :class="{ selected: category === currentCollectionCategory }" @click="selectCollectionCategory(category)">{{ category }}</button>
              </nav>
              <div v-if="showEntityGrid" class="entity-grid">
                <button v-for="artist in currentCollectionCategory === 'Artists' ? visibleArtists : []" :key="artist.name" class="entity-card" @click="openArtistSearch(artist.name)">
                  <span class="entity-cover artist-cover" :style="{ backgroundImage: `url('${artist.coverUrl}')` }" />
                  <strong>{{ artist.name }}</strong><small>Artist · {{ artist.trackCount }} {{ artist.trackCount === 1 ? 'song' : 'songs' }}</small>
                </button>
                <button v-for="album in currentCollectionCategory === 'Albums' ? visibleAlbums : []" :key="album.name" class="entity-card" @click="openAlbumSearch(album.name)">
                  <span class="entity-cover" :style="{ backgroundImage: `url('${album.coverUrl}')` }" />
                  <strong>{{ album.name }}</strong><small>{{ album.artist || 'Unknown artist' }} · {{ album.trackCount }} {{ album.trackCount === 1 ? 'song' : 'songs' }}</small>
                </button>
                <button v-for="playlist in currentCollectionCategory === 'Playlists' ? visiblePlaylists : []" :key="playlist.id" class="entity-card" @click="setView(playlist.name)">
                  <span class="entity-cover" :style="{ backgroundImage: `url('${playlist.coverUrl}')` }" />
                  <strong>{{ playlist.name }}</strong><small>Playlist · {{ tracks.filter((track) => track.playlistIds.includes(playlist.id)).length }} songs</small>
                </button>
                <p v-if="currentCollectionCategory === 'Podcasts' || entityResultCount === 0" class="no-results entity-empty">
                  <q-icon name="search_off" /><strong>{{ currentCollectionCategory === 'Podcasts' ? 'Podcasts are not available yet' : 'No results found' }}</strong>
                  <span>{{ currentCollectionCategory === 'Podcasts' ? 'Podcast discovery will be added in a future update.' : 'Try a different search or category.' }}</span>
                </p>
              </div>
              <template v-else>
                <div class="table-toolbar">
                  <span>{{ filteredTracks.length }} songs</span>
                  <div class="table-toolbar-actions">
                    <button v-if="tracksNeedingAudio.length && !props.localOnly" class="text-link" @click="openBulkAudioDialog">
                      <q-icon name="library_add" /> Attach audio ({{ tracksNeedingAudio.length }} missing)
                    </button>
                    <label>Sort by <q-select v-model="sortMode" dense borderless emit-value map-options :options="sortOptions" aria-label="Sort tracks" /></label>
                  </div>
                </div>
                <div class="track-table">
                  <div class="track-table-head"><span>#</span><span>TITLE</span><span class="album-column">ALBUM</span><span class="duration-column"><q-icon name="schedule" /></span><span class="like-column" /></div>
                  <div v-if="filteredTracks.length === 0" class="no-results"><q-icon name="music_off" /><strong>No tracks here yet</strong><span>Try another search or add a song to your library.</span></div>
                  <div v-for="(track, index) in filteredTracks" :key="track.id" class="track-table-row" :class="{ 'playing-row': playingTrack?.id === track.id && isPlaying }" @dblclick="playTrack(track)">
                    <button class="table-index" :aria-label="`Play ${track.title}`" @click="playTrack(track)"><span>{{ String(index + 1).padStart(2, '0') }}</span><q-icon :name="(playingTrack?.id === track.id && isPlaying) ? 'graphic_eq' : 'play_arrow'" /></button>
                    <button class="table-title" @click="playTrack(track)"><span class="table-cover" :style="{ backgroundImage: `url('${track.coverUrl}')` }" /><span class="title-stack"><strong>{{ track.title }}</strong><small>{{ getArtistDisplayName(track) }}</small></span></button>
                    <span class="table-album album-column">{{ track.album }}</span>
                    <span class="table-duration duration-column">{{ track.duration }}</span>
                    <button class="table-like like-column" :class="{ liked: track.is_favorite }" :aria-label="track.is_favorite ? 'Unlike track' : 'Like track'" @click="toggleFavorite(track)"><q-icon :name="track.is_favorite ? 'favorite' : 'favorite_border'" /></button>
                    <q-btn flat round dense icon="more_horiz" class="track-more" aria-label="Track actions"><q-menu><q-list dense class="track-menu"><q-item clickable v-close-popup @click="toggleFavorite(track)"><q-item-section>{{ track.is_favorite ? 'Remove from liked songs' : 'Add to liked songs' }}</q-item-section></q-item><q-item clickable v-close-popup @click="addToQueue(track)"><q-item-section>Add to queue</q-item-section></q-item><q-item v-if="track.isSeeded || isDemoCatalogTrack(track.title, track.artist)" clickable v-close-popup @click="linkYouTubeVideo(track)"><q-item-section>Link YouTube video</q-item-section></q-item><q-item v-for="playlist in playlists" :key="playlist.id" clickable v-close-popup @click="toggleTrackInPlaylist(track, playlist)"><q-item-section>{{ track.playlistIds.includes(playlist.id) ? 'Remove from' : 'Add to' }} {{ playlist.name }}</q-item-section></q-item><q-item v-if="track.artist.trim()" clickable v-close-popup @click="removeArtistCredit(track)"><q-item-section>Remove artist credit</q-item-section></q-item><q-item clickable v-close-popup @click="removeTrack(track)"><q-item-section class="remove-item">Remove from library</q-item-section></q-item></q-list></q-menu></q-btn>
                  </div>
                </div>
              </template>
            </section>

            <section v-if="activeView === 'Home' || activeView === 'Search' || activeView === 'Discover' || activeView === 'Explore' || activeView === 'Browse'" class="dashboard-section genres-section">
              <div class="section-heading"><div><p class="section-kicker">FIND YOUR FREQUENCY</p><h2>Explore by genre</h2></div><button class="text-link" @click="setView('Browse')">All genres <q-icon name="arrow_forward" /></button></div>
              <div class="genre-grid"><button v-for="genre in genres" :key="genre.name" class="genre-tile" :style="{ background: genre.color }" @click="filterByGenre(genre.name)"><span>{{ genre.name }}</span><q-icon name="arrow_outward" /></button></div>
            </section>
          </div>
        </div>
      </main>
    </div>

    <!-- Mini player -->
    <footer class="mini-player">
      <div class="now-playing">
        <span
          class="player-cover"
          :style="{ backgroundImage: `url('${playingTrack?.coverUrl || defaultCover}')` }"
        />
        <span class="now-playing-copy">
          <strong>{{ playingTrack?.title || 'Choose a track' }}</strong>
          <small>
            {{ playingTrack ? getArtistDisplayName(playingTrack) : 'Your next soundtrack starts here' }}
          </small>
        </span>
        <button
          class="player-like"
          :class="{ liked: playingTrack?.is_favorite }"
          :aria-label="playingTrack?.is_favorite ? 'Unlike current track' : 'Like current track'"
          :disabled="!playingTrack"
          @click="playingTrack && toggleFavorite(playingTrack)"
        >
          <q-icon :name="playingTrack?.is_favorite ? 'favorite' : 'favorite_border'" />
        </button>
      </div>
      <div class="player-controls">
        <div class="transport-buttons">
          <button aria-label="Shuffle" :class="{ selected: shuffleOn }" @click="shuffleOn = !shuffleOn"><q-icon name="shuffle" /></button>
          <button aria-label="Previous track" @click="stepTrack(-1)"><q-icon name="skip_previous" /></button>
          <button class="main-play" :aria-label="isPlaying ? 'Pause' : 'Play'" @click="togglePlayback()">
            <q-spinner v-if="isBuffering" size="20px" />
            <q-icon v-else :name="isPlaying ? 'pause' : 'play_arrow'" />
          </button>
          <button aria-label="Next track" @click="stepTrack(1)"><q-icon name="skip_next" /></button>
          <button aria-label="Repeat" :class="{ selected: repeatOn }" @click="repeatOn = !repeatOn"><q-icon name="repeat" /></button>
        </div>
        <div class="progress-row">
          <span>{{ elapsedLabel }}</span>
          <input v-model.number="progress" type="range" min="0" max="100" aria-label="Track progress" @input="seekTrack" />
          <span>{{ durationLabel }}</span>
        </div>
      </div>
      <div class="player-options"><button aria-label="Lyrics" @click="expandedPlayerOpen = true; lyricsPanelOpen = true"><q-icon name="subtitles" /></button><button aria-label="Queue" @click="queueOpen = !queueOpen"><q-icon name="queue_music" /></button><button aria-label="Volume" @click="muted = !muted"><q-icon :name="muted ? 'volume_off' : 'volume_up'" /></button><input v-model.number="volume" type="range" min="0" max="100" aria-label="Volume" /><button aria-label="Expand player" @click="expandedPlayerOpen = true"><q-icon name="open_in_full" /></button></div>
      <div v-if="queueOpen" class="queue-popover">
        <div class="queue-heading"><strong>Queue</strong><button aria-label="Close queue" @click="queueOpen = false"><q-icon name="close" /></button></div>
        <div v-if="playingTrack" class="queue-section-label">NOW PLAYING</div>
        <button v-if="playingTrack" class="queue-track" @click="playTrack(playingTrack)">
          <span class="queue-cover" :style="{ backgroundImage: `url('${playingTrack.coverUrl}')` }" />
          <span><strong>{{ playingTrack.title }}</strong><small>{{ getArtistDisplayName(playingTrack) }}</small></span>
          <q-icon name="graphic_eq" />
        </button>
        <div class="queue-section-label">NEXT UP <button v-if="queue.length" @click="clearQueue">Clear</button></div>
        <p v-if="queue.length === 0" class="queue-empty">Your queue is empty.</p>
        <div v-for="(track, index) in queue" :key="`${track.id}-${index}`" class="queue-track">
          <button class="queue-track-play" @click="playQueuedTrack(index)">
            <span class="queue-cover" :style="{ backgroundImage: `url('${track.coverUrl}')` }" />
            <span><strong>{{ track.title }}</strong><small>{{ getArtistDisplayName(track) }}</small></span>
            <q-icon name="play_arrow" />
          </button>
          <button class="queue-track-remove" :aria-label="`Remove ${track.title} from queue`" @click="removeFromQueue(index)"><q-icon name="close" /></button>
        </div>
      </div>
    </footer>

    <!-- ===== EXPANDED FULL-SCREEN PLAYER ===== -->
    <Transition name="player-expand">
      <div v-if="expandedPlayerOpen" class="expanded-player" role="dialog" aria-label="Now playing - expanded view">
        <div class="ep-backdrop" :style="{ backgroundImage: `url('${playingTrack?.coverUrl || defaultCover}')` }" />
        <div class="ep-backdrop-overlay" />

        <div class="ep-topbar">
          <button v-if="!youtubeVideoId" class="ep-close" aria-label="Collapse player" @click="expandedPlayerOpen = false">
            <q-icon name="keyboard_arrow_down" />
          </button>
          <div class="ep-topbar-center">
            <span class="ep-playing-from">NOW PLAYING</span>
            <span class="ep-playlist-name">{{ activePlaylist?.name || 'Your Library' }}</span>
          </div>
          <button class="ep-more" aria-label="More options" @click="queueOpen = !queueOpen">
            <q-icon name="queue_music" />
          </button>
        </div>

        <div class="ep-body">
          <div class="ep-art-section">
            <div v-if="youtubeVideoId" ref="youtubePlayerContainer" class="ep-youtube-player" aria-label="YouTube music player" />
            <template v-else>
              <div class="ep-vinyl-wrap" :class="{ 'ep-spinning': isPlaying }">
                <div class="ep-vinyl-disc">
                  <div class="ep-vinyl-center" :style="{ backgroundImage: `url('${playingTrack?.coverUrl || defaultCover}')` }" />
                </div>
              </div>
              <div class="ep-album-art" :class="{ 'ep-art-playing': isPlaying }" :style="{ backgroundImage: `url('${playingTrack?.coverUrl || defaultCover}')` }">
                <div class="ep-art-overlay" />
              </div>
            </template>
          </div>

          <div class="ep-controls-section">
            <div class="ep-track-info">
              <div class="ep-track-meta">
                <strong class="ep-track-title">{{ playingTrack?.title || 'Choose a track' }}</strong>
                <span class="ep-track-artist">{{ playingTrack ? getArtistDisplayName(playingTrack) : '' }}</span>
                <span v-if="playingTrack?.album" class="ep-track-album">{{ playingTrack.album }}</span>
              </div>
              <button
                class="ep-like-btn"
                :class="{ liked: playingTrack?.is_favorite }"
                :aria-label="playingTrack?.is_favorite ? 'Unlike' : 'Like'"
                :disabled="!playingTrack"
                @click="playingTrack && toggleFavorite(playingTrack)"
              >
                <q-icon :name="playingTrack?.is_favorite ? 'favorite' : 'favorite_border'" />
              </button>
            </div>

            <div class="ep-eq-bars" :class="{ 'ep-eq-active': isPlaying }">
              <span v-for="i in 18" :key="i" class="ep-eq-bar" :style="{ animationDelay: `${(i * 0.07).toFixed(2)}s` }" />
            </div>

            <div class="ep-progress-section">
              <div class="ep-progress-wrap">
                <input
                  v-model.number="progress"
                  type="range"
                  min="0"
                  max="100"
                  class="ep-progress"
                  aria-label="Track progress"
                  @input="seekTrack"
                />
                <div class="ep-progress-fill" :style="{ width: `${progress}%` }" />
              </div>
              <div class="ep-time-row">
                <span>{{ elapsedLabel }}</span>
                <span>{{ durationLabel }}</span>
              </div>
            </div>

            <div class="ep-transport">
              <button class="ep-ctrl ep-ctrl-sm" :class="{ active: shuffleOn }" aria-label="Shuffle" @click="shuffleOn = !shuffleOn">
                <q-icon name="shuffle" />
              </button>
              <button class="ep-ctrl" aria-label="Previous" @click="stepTrack(-1)">
                <q-icon name="skip_previous" />
              </button>
              <button class="ep-ctrl ep-play-btn" :aria-label="isPlaying ? 'Pause' : 'Play'" @click="togglePlayback()">
                <q-spinner v-if="isBuffering" size="28px" />
                <q-icon v-else :name="isPlaying ? 'pause' : 'play_arrow'" />
              </button>
              <button class="ep-ctrl" aria-label="Next" @click="stepTrack(1)">
                <q-icon name="skip_next" />
              </button>
              <button class="ep-ctrl ep-ctrl-sm" :class="{ active: repeatOn }" aria-label="Repeat" @click="repeatOn = !repeatOn">
                <q-icon name="repeat" />
              </button>
            </div>

            <div class="ep-volume-row">
              <button class="ep-vol-btn" aria-label="Toggle mute" @click="muted = !muted">
                <q-icon :name="muted ? 'volume_off' : volume < 40 ? 'volume_down' : 'volume_up'" />
              </button>
              <input v-model.number="volume" type="range" min="0" max="100" class="ep-volume" aria-label="Volume" />
              <button class="ep-vol-btn" aria-label="Queue" @click="queueOpen = !queueOpen">
                <q-icon name="queue_music" />
              </button>
            </div>

            <section class="ep-lyrics-panel" aria-label="Lyrics">
              <div class="ep-lyrics-heading">
                <strong>Lyrics</strong>
                <button :aria-label="lyricsPanelOpen ? 'Hide lyrics' : 'Show lyrics'" @click="lyricsPanelOpen = !lyricsPanelOpen">
                  <q-icon :name="lyricsPanelOpen ? 'expand_less' : 'expand_more'" />
                </button>
              </div>
              <div v-if="lyricsPanelOpen" class="ep-lyrics-content" aria-live="polite">
                <template v-if="timedLyrics.length">
                  <p
                    v-for="(line, index) in timedLyrics"
                    :key="`${line.time}-${index}`"
                    :class="{ 'ep-lyric-active': index === activeLyricIndex }"
                  >{{ line.text }}</p>
                </template>
                <p v-else-if="playingTrack?.lyricsText?.trim()" class="ep-plain-lyrics">
                  {{ playingTrack.lyricsText }}
                </p>
                <p v-else class="ep-lyrics-empty">
                  No lyrics saved. Add lyrics you own or are licensed to use.
                </p>
              </div>
            </section>

            <div v-if="queueOpen" class="ep-queue">
              <div class="ep-queue-head">
                <strong>Queue</strong>
                <button @click="queueOpen = false"><q-icon name="close" /></button>
              </div>
              <div v-if="playingTrack" class="ep-queue-section">NOW PLAYING</div>
              <button v-if="playingTrack" class="ep-queue-item ep-queue-now" @click="playTrack(playingTrack)">
                <span class="ep-qi-cover" :style="{ backgroundImage: `url('${playingTrack.coverUrl}')` }" />
                <span class="ep-qi-info"><strong>{{ playingTrack.title }}</strong><small>{{ getArtistDisplayName(playingTrack) }}</small></span>
                <q-icon name="graphic_eq" class="ep-qi-eq" />
              </button>
              <div class="ep-queue-section">NEXT UP <button v-if="queue.length" @click="clearQueue">Clear</button></div>
              <p v-if="queue.length === 0" class="ep-queue-empty">Your queue is empty.</p>
              <div v-for="(track, index) in queue" :key="`ep-${track.id}-${index}`" class="ep-queue-item">
                <button class="ep-qi-play" @click="playQueuedTrack(index)">
                  <span class="ep-qi-cover" :style="{ backgroundImage: `url('${track.coverUrl}')` }" />
                  <span class="ep-qi-info"><strong>{{ track.title }}</strong><small>{{ getArtistDisplayName(track) }}</small></span>
                  <q-icon name="play_arrow" />
                </button>
                <button class="ep-qi-remove" :aria-label="`Remove ${track.title} from queue`" @click="removeFromQueue(index)"><q-icon name="close" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <!-- ===== END EXPANDED PLAYER ===== -->

    <audio
      hidden
      ref="audioElement"
      preload="metadata"
      @timeupdate="onAudioTimeUpdate"
      @loadedmetadata="onAudioMetadata"
      @durationchange="onAudioMetadata"
      @waiting="isBuffering = true"
      @canplay="isBuffering = false"
      @playing="onAudioPlay"
      @pause="onAudioPause"
      @ended="onAudioEnded"
      @error="handleAudioError"
    />

    <q-dialog v-model="trackDialogOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card class="sonora-dialog upload-dialog">
        <q-card-section class="dialog-title-row"><div><small>ADD MUSIC TO YOUR LIBRARY</small><h3>Upload music</h3></div><q-btn flat round dense icon="close" aria-label="Close dialog" v-close-popup /></q-card-section>
        <q-form @submit.prevent="createTrack">
          <q-card-section class="dialog-fields">
            <section class="upload-file-panel" aria-labelledby="upload-file-heading">
              <div class="upload-section-heading">
                <span class="upload-step">1</span>
                <div>
                  <h4 id="upload-file-heading">Choose audio file <span>*</span></h4>
                  <p>Select the song you want to add.</p>
                </div>
              </div>
              <input ref="audioFileInput" class="audio-file-input" type="file" accept="audio/*" @change="selectAudioFile" />
              <button type="button" class="outline-button audio-file-button" :class="{ 'has-file': Boolean(selectedAudioFile) }" @click="audioFileInput?.click()">
                <q-icon :name="selectedAudioFile ? 'audio_file' : 'upload_file'" />
                <span class="audio-file-name">{{ selectedAudioFile ? `${selectedAudioFile.name} (${(selectedAudioFile.size / (1024 * 1024)).toFixed(1)} MB)` : 'Browse audio files' }}</span>
              </button>
              <button v-if="selectedAudioFile" type="button" class="audio-clear-btn" aria-label="Clear selected file" @click.stop="clearSelectedAudio">
                <q-icon name="close" />
              </button>
              <p class="audio-file-hint">Audio files up to 50 MB, or paste a direct audio URL or YouTube link below.</p>
              <q-input v-model="trackForm.audioUrl" outlined stack-label dense label="Or audio / YouTube URL" placeholder="https://youtu.be/VIDEO_ID" hint="YouTube playback uses the visible embedded player." class="q-mt-sm" />
            </section>

            <section class="upload-details-panel" aria-labelledby="upload-details-heading">
              <div class="upload-section-heading">
                <span class="upload-step">2</span>
                <div>
                  <h4 id="upload-details-heading">Song details</h4>
                  <p>Required fields are marked with <span>*</span>.</p>
                </div>
              </div>
              <div class="upload-detail-fields">
                <q-input v-model="trackForm.title" outlined stack-label label="Song title *" placeholder="e.g. Night Drive" :rules="[requiredRule]" autofocus />
                <q-input v-model="trackForm.artist" outlined stack-label label="Artist *" placeholder="e.g. Your artist name" :rules="[requiredRule]" />
                <q-input v-model="trackForm.album" outlined stack-label label="Album" placeholder="Album name (optional)" />
                <q-input v-model="trackForm.coverUrl" outlined stack-label persistent-hint label="Cover image URL" placeholder="https://example.com/cover.jpg" hint="Optional · Paste a direct link to an image." />
                <q-input v-model="trackForm.lyricsText" outlined stack-label type="textarea" label="Lyrics (plain text)" hint="Only enter lyrics you own or are licensed to store." />
                <q-input v-model="trackForm.lyricsLrc" outlined stack-label type="textarea" label="Timed lyrics (LRC, optional)" hint="Use timestamped lines such as [00:12.50] lyric text." />
                <q-select v-model="trackForm.genre" outlined stack-label emit-value map-options label="Genre" :options="genres.map((genre) => ({ label: genre.name, value: genre.name }))" />
                <q-select v-model="selectedPlaylistId" outlined stack-label clearable emit-value map-options label="Playlist" :options="playlists.map((playlist) => ({ label: playlist.name, value: playlist.id }))" />
              </div>
            </section>
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat no-caps label="Cancel" v-close-popup />
            <q-btn unelevated no-caps :label="uploadingTrack ? 'Uploading…' : 'Upload music'" type="submit" class="lime-button" :loading="uploadingTrack" :disable="uploadingTrack" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="bulkAudioDialogOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card class="sonora-dialog upload-dialog bulk-audio-dialog">
        <q-card-section class="dialog-title-row">
          <div><small>ADD AUDIO TO YOUR CATALOG</small><h3>Attach audio to existing songs</h3></div>
          <q-btn flat round dense icon="close" aria-label="Close dialog" v-close-popup :disable="uploadingBulkAudio" />
        </q-card-section>
        <q-card-section class="bulk-audio-content">
          <p>Choose audio files you own or are licensed to use. Sonora can match filenames to song titles; review or change each match before uploading. Files must be 50 MB or smaller.</p>
          <input ref="bulkAudioInput" class="audio-file-input" type="file" accept="audio/*" multiple @change="selectBulkAudioFiles" />
          <button type="button" class="outline-button audio-file-button" :disabled="uploadingBulkAudio" @click="bulkAudioInput?.click()">
            <q-icon name="library_music" />
            <span>Choose audio files</span>
          </button>
          <div v-if="bulkAudioAssignments.length" class="bulk-audio-list">
            <div v-for="(assignment, index) in bulkAudioAssignments" :key="`${assignment.file.name}-${index}`" class="bulk-audio-row">
              <div class="bulk-audio-file">
                <strong>{{ assignment.file.name }}</strong>
                <small>{{ (assignment.file.size / (1024 * 1024)).toFixed(1) }} MB</small>
              </div>
              <q-select
                v-model="assignment.trackId"
                outlined
                dense
                emit-value
                map-options
                :disable="uploadingBulkAudio"
                label="Match to song"
                :options="bulkAudioOptionsFor(index)"
                class="bulk-audio-track-select"
              />
              <q-btn flat round dense icon="close" :aria-label="`Remove ${assignment.file.name}`" :disable="uploadingBulkAudio" @click="removeBulkAudioFile(index)" />
            </div>
          </div>
          <p v-else class="bulk-audio-empty">No audio files selected yet.</p>
          <p v-if="uploadingBulkAudio" class="bulk-audio-progress">Uploading {{ bulkAudioProgress }} of {{ bulkAudioAssignments.length }}… Keep this page open.</p>
        </q-card-section>
        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat no-caps label="Cancel" v-close-popup :disable="uploadingBulkAudio" />
          <q-btn unelevated no-caps :label="uploadingBulkAudio ? 'Uploading…' : bulkAudioNeedsSync ? 'Retry saving links' : 'Upload and attach'" class="lime-button" :loading="uploadingBulkAudio" :disable="!canUploadBulkAudio" @click="uploadBulkAudio" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="playlistDialogOpen">
      <q-card class="sonora-dialog">
        <q-card-section class="dialog-title-row"><div><small>MAKE IT YOURS</small><h3>{{ editingPlaylistId ? 'Edit playlist' : 'New playlist' }}</h3></div><q-btn flat round dense icon="close" aria-label="Close dialog" v-close-popup /></q-card-section>
        <q-form @submit.prevent="savePlaylist"><q-card-section class="dialog-fields"><p class="form-required-note"><span>*</span> Required fields</p><q-input v-model="playlistName" outlined stack-label label="Playlist name *" placeholder="e.g. Sunday Slowdown" maxlength="32" autofocus :rules="[requiredRule]" /><q-input v-model="playlistCoverUrl" outlined stack-label persistent-hint label="Cover image URL" placeholder="https://example.com/cover.jpg" hint="Optional · Paste a direct link to an image." /></q-card-section><q-card-actions align="between" class="dialog-actions"><q-btn v-if="editingPlaylistId" flat no-caps label="Delete playlist" color="negative" @click="deletePlaylist()" /><q-space /><q-btn flat no-caps label="Cancel" v-close-popup /><q-btn unelevated no-caps :label="editingPlaylistId ? 'Save changes' : 'Create playlist'" type="submit" class="lime-button" /></q-card-actions></q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="upgradeDialogOpen">
      <q-card class="sonora-dialog yt-upgrade-dialog">
        <q-card-section class="dialog-title-row">
          <div>
            <small class="upgrade-tag">SONORA PREMIUM</small>
            <h3>Elevate your sound</h3>
          </div>
          <q-btn flat round dense icon="close" aria-label="Close dialog" v-close-popup />
        </q-card-section>
        <q-card-section class="upgrade-content">
          <div class="upgrade-perks">
            <div class="upgrade-perk">
              <q-icon name="check_circle" class="perk-icon" />
              <span>Ad-free, uninterrupted listening</span>
            </div>
            <div class="upgrade-perk">
              <q-icon name="check_circle" class="perk-icon" />
              <span>Lossless studio-grade FLAC playback</span>
            </div>
            <div class="upgrade-perk">
              <q-icon name="check_circle" class="perk-icon" />
              <span>Unlimited playlist creation &amp; cloud storage</span>
            </div>
          </div>
          <div class="upgrade-status-box">
            <span class="status-pill">Active Preview</span>
            <p>You have full access to all Sonora Premium features during our beta preview!</p>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn unelevated no-caps label="Got it" class="lime-button" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  getListeningHistory,
  getPlaylists,
  getTracks,
  getYouTubeVideoId,
  isDemoCatalogTrack,
  makeTrack,
  resolveTrackAudioUrl,
  saveListeningHistory,
  savePlaylists,
  saveTracks,
  type ListeningHistoryItem,
  type MusicTrack,
  type NewTrack,
  type Playlist,
} from '@/services/sonora-library';
import {
  deletePlaylistFromSupabase,
  deleteTrackAudio,
  deleteTrackFromSupabase,
  loadLibraryFromSupabase,
  resolveTrackAudioSource,
  saveLibraryToSupabase,
  uploadTrackAudio,
  verifyTrackAudioPaths,
  type TrackAudioPathStatus,
} from '../../../lib/supabase/library';

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: { autoplay: 1; controls: 1; playsinline: 1; rel: 0 };
      events: {
        onReady: (event: YouTubePlayerEvent) => void;
        onStateChange: (event: YouTubePlayerEvent) => void;
        onError: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const props = withDefaults(defineProps<{ userId: string; userEmail: string; localOnly?: boolean }>(), {
  localOnly: false,
});
defineEmits<{ (event: 'sign-out'): void }>();
const $q = useQuasar();
const heroImage = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=90';
const defaultCover = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=320&q=80';
const moodMixes = [
  { label: 'GOOD VIBES ONLY', title: 'After Hours', caption: 'For when the city slows down', mood: 'Late night', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85', shade: 'linear-gradient(90deg,rgba(14,18,35,.88),rgba(20,13,28,.1))' },
  { label: 'SUNSET SESSIONS', title: 'Golden Hour', caption: 'A little warmth for your day', mood: 'Chill', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85', shade: 'linear-gradient(90deg,rgba(35,22,21,.8),rgba(26,19,24,.12))' },
  { label: 'MADE FOR YOU', title: 'Head in the Clouds', caption: 'Drift away for a while', mood: 'Focus', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85', shade: 'linear-gradient(0deg,rgba(15,23,32,.8),rgba(18,24,32,.04))' },
];
const homeMoods = [
  { label: 'Relax', mood: 'Chill' },
  { label: 'Sleep', mood: 'Focus' },
  { label: 'Sad', mood: 'Late night' },
  { label: 'Romance', mood: 'Late night' },
  { label: 'Energize', mood: 'Feel good' },
  { label: 'Feel good', mood: 'Feel good' },
  { label: 'Party', mood: 'Feel good' },
  { label: 'Workout', mood: 'Feel good' },
  { label: 'Commute', mood: 'Night drive' },
  { label: 'Focus', mood: 'Focus' },
];
const genres = [
  { name: 'Pop', color: '#a46483' }, { name: 'OPM', color: '#a76654' }, { name: 'Rock', color: '#7865a5' },
  { name: 'Hip-Hop', color: '#607ca0' }, { name: 'R&B', color: '#a76654' }, { name: 'Jazz', color: '#557b72' },
  { name: 'Classical', color: '#7865a5' }, { name: 'Electronic', color: '#607ca0' }, { name: 'K-Pop', color: '#a46483' },
  { name: 'Indie', color: '#7865a5' }, { name: 'Acoustic', color: '#92784f' }, { name: 'Lo-Fi', color: '#557b72' },
  { name: 'Country', color: '#92784f' }, { name: 'Reggae', color: '#66824d' }, { name: 'Metal', color: '#665b70' },
  { name: 'Alternative', color: '#7865a5' }, { name: 'Soul', color: '#a76654' }, { name: 'Blues', color: '#607ca0' },
];
const sortOptions = [{ label: 'Default', value: 'default' }, { label: 'Title', value: 'title' }, { label: 'Artist', value: 'artist' }, { label: 'Recently added', value: 'recent' }];
const searchCategories = ['All', 'Songs', 'Artists', 'Albums', 'Playlists'];
const libraryCategories = ['Songs', 'Playlists', 'Albums', 'Artists', 'Podcasts'];
const tracks = ref<MusicTrack[]>([]);
const playlists = ref<Playlist[]>([]);
const listeningHistory = ref<ListeningHistoryItem[]>([]);
const queue = ref<MusicTrack[]>([]);
const activeView = ref('Home');
const libraryReady = ref(false);
const libraryLoading = ref(false);
const libraryLoadError = ref('');
const storageAudioStatuses = ref<TrackAudioPathStatus[]>([]);
const searchQuery = ref('');
const searchCategory = ref('Songs');
const libraryCategory = ref('Songs');
const sortMode = ref('default');
const playingTrack = ref<MusicTrack | null>(null);
const youtubePlayerContainer = ref<HTMLDivElement | null>(null);
const youtubeVideoId = computed(() => getYouTubeVideoId(playingTrack.value?.audioUrl));
const audioElement = ref<HTMLAudioElement | null>(null);
const audioFileInput = ref<HTMLInputElement | null>(null);
const selectedAudioFile = ref<File | null>(null);
const bulkAudioInput = ref<HTMLInputElement | null>(null);
const bulkAudioAssignments = ref<{ file: File; trackId: string }[]>([]);
const bulkAudioProgress = ref(0);
const bulkAudioNeedsSync = ref(false);
const selectedPlaylistId = ref<string | null>(null);
const uploadingTrack = ref(false);
const uploadingBulkAudio = ref(false);
const darkMode = ref(true);
const isPlaying = ref(false);
const isBuffering = ref(false);
const shuffleOn = ref(false);
const repeatOn = ref(false);
const muted = ref(false);
const volume = ref(68);
const progress = ref(0);
const elapsedSeconds = ref(0);
const audioCurrentTime = ref(0);
const audioDurationSeconds = ref(0);
let youtubePlayer: YouTubePlayer | undefined;
let youtubeProgressTimer: ReturnType<typeof setInterval> | undefined;
const profileMenu = ref(false);
const sidebarOpen = ref(typeof window !== 'undefined' ? window.innerWidth > 700 : true);
const listenAgainRow = ref<HTMLElement | null>(null);
const queueOpen = ref(false);
const expandedPlayerOpen = ref(false);
const lyricsPanelOpen = ref(false);
const trackDialogOpen = ref(false);
const bulkAudioDialogOpen = ref(false);
const playlistDialogOpen = ref(false);
const upgradeDialogOpen = ref(false);
const selectedMood = ref<string | null>(null);
const playlistName = ref('');
const playlistCoverUrl = ref('');
const editingPlaylistId = ref<string | null>(null);
const trackForm = reactive<NewTrack>({ title: '', artist: '', album: '', coverUrl: '', genre: 'Indie', mood: 'Chill', audioUrl: '', lyricsText: '', lyricsLrc: '' });
const requiredRule = (value: string) => Boolean(value?.trim()) || 'This field is required';
let librarySaveTimer: ReturnType<typeof setTimeout> | undefined;
let playbackGeneration = 0;
let storageRefreshAttemptedTrackId = '';
let playbackFailureNotifiedTrackId = '';
let youtubeApiPromise: Promise<YouTubeApi> | undefined;
let youtubePlayerVideoId = '';
const maxAudioFileSize = 50 * 1024 * 1024;

const listenerDisplayName = computed(() => {
  if (props.userEmail && props.userEmail.toLowerCase().includes('angoring')) {
    return 'ANGORING JR EDWIN G.';
  }
  return props.userEmail ? props.userEmail.split('@')[0]?.toUpperCase() : 'ANGORING JR EDWIN G.';
});

const favoriteCount = computed(() => tracks.value.filter((track: MusicTrack) => track.is_favorite).length);
const tracksNeedingAudio = computed(() => tracks.value.filter((track) => {
  const status = storageAudioStatuses.value.find((item) => item.trackId === track.id)?.status;
  return (!track.audioPath && !track.audioUrl) || status === 'missing' || status === 'wrong-bucket';
}));
const canUploadBulkAudio = computed(() =>
  !props.localOnly &&
  !uploadingBulkAudio.value &&
  (bulkAudioNeedsSync.value || (
    bulkAudioAssignments.value.length > 0 &&
    bulkAudioAssignments.value.every((assignment) => Boolean(assignment.trackId)) &&
    new Set(bulkAudioAssignments.value.map((assignment) => assignment.trackId)).size === bulkAudioAssignments.value.length
  )),
);
const activePlaylist = computed(() => playlists.value.find((playlist) => playlist.name === activeView.value));

const greetingLabel = computed(() => {
  const hour = new Date().getHours();
  return hour < 12 ? 'YOUR DAILY SOUNDTRACK' : hour < 18 ? 'YOUR DAILY SOUNDTRACK' : 'YOUR DAILY SOUNDTRACK';
});
const pageTitle = computed(() => activeView.value === 'Home' ? `Good evening, ${props.userEmail.split('@')[0] || 'listener'}` : activeView.value === 'Search' ? 'Find your next favorite' : activeView.value === 'Browse' ? 'Explore something new' : activeView.value === 'Liked Songs' ? 'Your liked songs' : activeView.value === 'Your Library' || activeView.value === 'Library' ? 'Your library' : activeView.value);
const collectionCategories = computed(() =>
  activeView.value === 'Search' ? searchCategories : libraryCategories,
);
const currentCollectionCategory = computed(() =>
  activeView.value === 'Search' ? searchCategory.value : libraryCategory.value,
);
const collectionHeading = computed(() => {
  if (activeView.value === 'Search') return searchQuery.value ? 'Search results' : 'Search Sonora';
  if (activeView.value === 'Your Library' || activeView.value === 'Library') {
    return libraryCategory.value === 'Songs' ? 'Your songs' : `Your ${libraryCategory.value.toLocaleLowerCase()}`;
  }
  if (activeView.value === 'Browse') return 'Explore by genre';
  if (activeView.value === 'Explore') return 'Discover new music';
  if (activeView.value === 'Liked Songs') return 'Liked songs';
  return 'Popular right now';
});
const showEntityGrid = computed(() => {
  if (activeView.value === 'Search') {
    return ['Artists', 'Albums', 'Playlists'].includes(searchCategory.value);
  }
  return (
    (activeView.value === 'Your Library' || activeView.value === 'Library') &&
    libraryCategory.value !== 'Songs'
  );
});
const allLibraryTracks = computed<MusicTrack[]>(() => tracks.value);

const filteredTracks = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  const source = allLibraryTracks.value;
  let result = source.filter((track: MusicTrack) => {
    const inPlaylist = playlists.value.find((playlist: Playlist) => playlist.name === activeView.value);
    const matchesView = activeView.value === 'Liked Songs' ? track.is_favorite : inPlaylist ? track.playlistIds.includes(inPlaylist.id) : true;
    const matchesMood = !selectedMood.value || track.mood === selectedMood.value;
    const matchesSearch = !query || `${track.title} ${getArtistDisplayName(track)} ${track.album} ${track.genre}`.toLocaleLowerCase().includes(query);
    return matchesView && matchesMood && matchesSearch;
  });
  result = [...result];
  if (sortMode.value === 'title') result.sort((a: MusicTrack, b: MusicTrack) => a.title.localeCompare(b.title));
  if (sortMode.value === 'artist') result.sort((a: MusicTrack, b: MusicTrack) => a.artist.localeCompare(b.artist));
  if (sortMode.value === 'recent') result.sort((a: MusicTrack, b: MusicTrack) => b.createdAt.localeCompare(a.createdAt));
  return result;
});
const artistResults = computed(() => {
  const artists = new Map<string, MusicTrack[]>();
  for (const track of allLibraryTracks.value) {
    const artistName = getArtistDisplayName(track);
    const songs = artists.get(artistName) || [];
    songs.push(track);
    artists.set(artistName, songs);
  }
  return [...artists].map(([name, songs]) => ({
    name,
    coverUrl: songs[0]?.coverUrl || defaultCover,
    trackCount: songs.length,
  }));
});
const visibleArtists = computed(() => {
  const query =
    activeView.value === 'Search' && searchCategory.value === 'Artists'
      ? searchQuery.value.trim().toLocaleLowerCase()
      : '';
  return artistResults.value.filter((artist) => artist.name.toLocaleLowerCase().includes(query));
});
const albumResults = computed(() => {
  const albums = new Map<string, MusicTrack[]>();
  for (const track of allLibraryTracks.value) {
    const songs = albums.get(track.album) || [];
    songs.push(track);
    albums.set(track.album, songs);
  }
  return [...albums].map(([name, songs]) => ({
    name,
    artist: songs[0]?.artist || '',
    coverUrl: songs[0]?.coverUrl || defaultCover,
    trackCount: songs.length,
  }));
});
const visibleAlbums = computed(() => {
  const query =
    activeView.value === 'Search' && searchCategory.value === 'Albums'
      ? searchQuery.value.trim().toLocaleLowerCase()
      : '';
  return albumResults.value.filter(
    (album) =>
      album.name.toLocaleLowerCase().includes(query) ||
      album.artist.toLocaleLowerCase().includes(query),
  );
});
const visiblePlaylists = computed(() => {
  const query =
    activeView.value === 'Search' && searchCategory.value === 'Playlists'
      ? searchQuery.value.trim().toLocaleLowerCase()
      : '';
  return playlists.value.filter((playlist) => {
    if (playlist.name.toLocaleLowerCase().includes(query)) return true;
    if (!query) return true;
    return tracks.value.some(
      (track) =>
        track.playlistIds.includes(playlist.id) &&
        `${track.title} ${getArtistDisplayName(track)} ${track.album}`.toLocaleLowerCase().includes(query),
    );
  });
});
const entityResultCount = computed(() => {
  if (currentCollectionCategory.value === 'Artists') return visibleArtists.value.length;
  if (currentCollectionCategory.value === 'Albums') return visibleAlbums.value.length;
  if (currentCollectionCategory.value === 'Playlists') return visiblePlaylists.value.length;
  return 0;
});
const recentlyPlayedTracks = computed(() =>
  listeningHistory.value
    .map((item) => tracks.value.find((track) => track.id === item.trackId))
    .filter((track): track is MusicTrack => Boolean(track))
    .slice(0, 4),
);
const homeAlbums = computed(() =>
  albumResults.value.filter((album) => album.name.trim()).slice(0, 6),
);
const homeListenAgainTracks = computed(() => {
  if (recentlyPlayedTracks.value.length) return recentlyPlayedTracks.value;
  return tracks.value.slice(0, 6);
});
const elapsedLabel = computed(() => formatDuration(audioCurrentTime.value));
const durationLabel = computed(() =>
  Number.isFinite(audioDurationSeconds.value) && audioDurationSeconds.value > 0
    ? formatDuration(audioDurationSeconds.value)
    : playingTrack.value?.duration || '0:00',
);
const timedLyrics = computed(() => {
  const lyrics = playingTrack.value?.lyricsLrc?.trim();
  if (!lyrics) return [];
  const lines: { time: number; text: string }[] = [];
  for (const rawLine of lyrics.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    const text = rawLine.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, '').trim();
    for (const match of matches) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = Number(`0.${match[3] || '0'}`);
      if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
        lines.push({ time: minutes * 60 + seconds + fraction, text });
      }
    }
  }
  return lines.sort((first, second) => first.time - second.time);
});
const activeLyricIndex = computed(() => {
  let activeIndex = -1;
  for (let index = 0; index < timedLyrics.value.length; index += 1) {
    if (timedLyrics.value[index]!.time > audioCurrentTime.value) break;
    activeIndex = index;
  }
  return activeIndex;
});

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('The YouTube player API did not initialize.'));
    };

    let script = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('Could not load the YouTube player API.'));
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

function stopYouTubeProgressUpdates() {
  if (youtubeProgressTimer) clearInterval(youtubeProgressTimer);
  youtubeProgressTimer = undefined;
}

function updateYouTubeProgress() {
  if (!youtubePlayer) return;
  const currentTime = youtubePlayer.getCurrentTime();
  const duration = youtubePlayer.getDuration();
  if (Number.isFinite(currentTime)) {
    audioCurrentTime.value = currentTime;
    elapsedSeconds.value = Math.floor(currentTime);
  }
  if (Number.isFinite(duration) && duration > 0) {
    audioDurationSeconds.value = duration;
    progress.value = (currentTime / duration) * 100;
  }
}

function createYouTubePlayer(api: YouTubeApi, videoId: string) {
  const container = youtubePlayerContainer.value;
  if (!container) throw new Error('The visible YouTube player is not available.');

  youtubePlayerVideoId = videoId;
  youtubePlayer = new api.Player(container, {
    videoId,
    playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0 },
    events: {
      onReady: (event) => {
        youtubePlayer = event.target;
        youtubePlayer.setVolume(volume.value);
        if (muted.value) youtubePlayer.mute();
        if (
          youtubePlayerVideoId === videoId &&
          playingTrack.value?.audioUrl &&
          getYouTubeVideoId(playingTrack.value.audioUrl) === videoId &&
          isPlaying.value
        ) {
          youtubePlayer.playVideo();
        }
      },
      onStateChange: (event) => {
        if (
          youtubePlayerVideoId !== videoId ||
          getYouTubeVideoId(playingTrack.value?.audioUrl) !== videoId
        ) return;
        if (event.data === api.PlayerState.PLAYING) {
          isPlaying.value = true;
          isBuffering.value = false;
          stopYouTubeProgressUpdates();
          youtubeProgressTimer = setInterval(updateYouTubeProgress, 500);
        } else if (event.data === api.PlayerState.BUFFERING) {
          isBuffering.value = true;
        } else if (event.data === api.PlayerState.PAUSED) {
          isPlaying.value = false;
          isBuffering.value = false;
          stopYouTubeProgressUpdates();
          updateYouTubeProgress();
        } else if (event.data === api.PlayerState.ENDED) {
          isBuffering.value = false;
          stopYouTubeProgressUpdates();
          stepTrack(1, true);
        }
      },
      onError: () => {
        if (
          youtubePlayerVideoId !== videoId ||
          getYouTubeVideoId(playingTrack.value?.audioUrl) !== videoId
        ) return;
        const track = playingTrack.value;
        if (track) reportPlaybackFailure(track, new Error('YouTube could not play this video.'));
      },
    },
  });
}

onMounted(() => {
  darkMode.value = localStorage.getItem('sonora-theme') === 'dark';
  $q.dark.set(darkMode.value);
  sidebarOpen.value = window.matchMedia('(min-width: 701px)').matches;
  if (audioElement.value) audioElement.value.volume = volume.value / 100;
  void loadLibrary();
  window.addEventListener('keydown', onShortcut);
  window.addEventListener('keydown', onEscKey);
});

watch([playingTrack, isPlaying], async ([track, shouldPlay], [previousTrack]) => {
  const audio = audioElement.value;
  if (!audio) return;
  if (!track) {
    playbackGeneration += 1;
    audio.pause();
    audio.removeAttribute('src');
    youtubePlayer?.destroy();
    youtubePlayer = undefined;
    youtubePlayerVideoId = '';
    stopYouTubeProgressUpdates();
    audioDurationSeconds.value = 0;
    audioCurrentTime.value = 0;
    return;
  }

  const videoId = getYouTubeVideoId(track.audioUrl);
  if (videoId) {
    audio.pause();
    const generation = ++playbackGeneration;
    expandedPlayerOpen.value = true;
    if (!shouldPlay) {
      isBuffering.value = false;
      stopYouTubeProgressUpdates();
      youtubePlayer?.pauseVideo();
      return;
    }
    if (track.id !== previousTrack?.id) {
      isBuffering.value = true;
      audioCurrentTime.value = 0;
      audioDurationSeconds.value = 0;
      elapsedSeconds.value = 0;
      progress.value = 0;
    }
    try {
      await nextTick();
      const api = await loadYouTubeApi();
      if (
        generation !== playbackGeneration ||
        playingTrack.value?.id !== track.id ||
        !isPlaying.value
      ) return;
      if (!youtubePlayer || youtubePlayerVideoId !== videoId) {
        youtubePlayer?.destroy();
        createYouTubePlayer(api, videoId);
      } else {
        youtubePlayer.playVideo();
      }
    } catch (error) {
      if (generation === playbackGeneration) reportPlaybackFailure(track, error);
    }
    return;
  }

  if (youtubePlayer) {
    youtubePlayer.destroy();
    youtubePlayer = undefined;
    youtubePlayerVideoId = '';
    stopYouTubeProgressUpdates();
  }

  if (!shouldPlay) {
    playbackGeneration += 1;
    audio.pause();
    return;
  }

  const isNewTrack = track.id !== previousTrack?.id;
  const generation = ++playbackGeneration;
  if (isNewTrack) {
    audio.pause();
    storageRefreshAttemptedTrackId = '';
    playbackFailureNotifiedTrackId = '';
    audioCurrentTime.value = 0;
    audioDurationSeconds.value = 0;
    progress.value = 0;
    elapsedSeconds.value = 0;
    isBuffering.value = true;
  }
  try {
    if (isNewTrack || !audio.currentSrc) {
      const source = await resolveTrackAudioSource(track);
      if (generation !== playbackGeneration || playingTrack.value?.id !== track.id || !isPlaying.value) return;
      audio.src = source;
      audio.load();
    }
    await audio.play();
  } catch (error) {
    if (generation !== playbackGeneration || isAbortError(error)) return;
    if (track.audioPath && !(error instanceof DOMException && error.name === 'NotAllowedError')) {
      const refreshed = await retryStorageAudio(track, audio.currentTime, generation);
      if (refreshed) return;
    }
    reportPlaybackFailure(track, error);
  }
}, { flush: 'post' });

watch([volume, muted], ([vol, isMuted]) => {
  if (audioElement.value) {
    audioElement.value.volume = vol / 100;
    audioElement.value.muted = isMuted;
  }
  youtubePlayer?.setVolume(vol);
  if (isMuted) youtubePlayer?.mute();
  else youtubePlayer?.unMute();
});

onUnmounted(() => {
  playbackGeneration += 1;
  window.removeEventListener('keydown', onShortcut);
  window.removeEventListener('keydown', onEscKey);
  audioElement.value?.pause();
  youtubePlayer?.destroy();
  stopYouTubeProgressUpdates();
  if (librarySaveTimer) {
    clearTimeout(librarySaveTimer);
    void persistLibrary();
  }
});

watch([tracks, playlists], () => {
  if (!libraryReady.value) return;
  try {
    saveTracks(props.userId, tracks.value);
    savePlaylists(props.userId, playlists.value);
    if (librarySaveTimer) clearTimeout(librarySaveTimer);
    librarySaveTimer = setTimeout(() => {
      librarySaveTimer = undefined;
      void persistLibrary();
    }, 350);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to save your local library.',
      position: 'bottom',
    });
  }
}, { deep: true });

async function loadLibrary() {
  libraryLoading.value = true;
  libraryLoadError.value = '';
  try {
    const localLibrary = {
      tracks: getTracks(props.userId),
      playlists: getPlaylists(props.userId),
    };
    const library = props.localOnly
      ? localLibrary
      : await loadLibraryFromSupabase(props.userId);
    tracks.value = library.tracks;
    playlists.value = library.playlists;
    listeningHistory.value = getListeningHistory(props.userId);
    saveTracks(props.userId, tracks.value);
    savePlaylists(props.userId, library.playlists);
    libraryReady.value = true;
    if (!props.localOnly) {
      try {
        storageAudioStatuses.value = await verifyTrackAudioPaths(tracks.value);
        const missing = storageAudioStatuses.value.filter((status) => status.status === 'missing');
        const wrongBucket = storageAudioStatuses.value.filter((status) => status.status === 'wrong-bucket');
        const legacyBucket = storageAudioStatuses.value.filter((status) => status.status === 'legacy-bucket');
        const noAudio = tracks.value.filter((track) => !track.audioPath && !track.audioUrl);
        const unverified = storageAudioStatuses.value.filter((status) => status.status === 'unverified');
        const describeTracks = (items: { title: string }[]) => {
          const names = items.slice(0, 3).map((item) => item.title).join(', ');
          return items.length > 3 ? `${names}, and ${items.length - 3} more` : names;
        };
        const problems = [
          missing.length ? `missing Storage file(s): ${describeTracks(missing)}` : '',
          wrongBucket.length ? `unsupported bucket path(s): ${describeTracks(wrongBucket)}` : '',
          legacyBucket.length ? `legacy tracks bucket file(s): ${describeTracks(legacyBucket)}` : '',
          noAudio.length ? `no audio file or URL: ${describeTracks(noAudio)}` : '',
          unverified.length ? `unverified Storage path(s): ${describeTracks(unverified)}` : '',
        ].filter(Boolean);
        if (problems.length) {
          $q.notify({
            type: 'warning',
            message: `${problems.join('; ')}. See the affected track before playback.`,
            position: 'bottom',
            timeout: 7000,
          });
        }
      } catch (error) {
        $q.notify({
          type: 'warning',
          message: error instanceof Error
            ? `Could not verify music Storage paths: ${error.message}`
            : 'Could not verify music Storage paths.',
          position: 'bottom',
          timeout: 7000,
        });
      }
    }
  } catch (error) {
    libraryLoadError.value =
      error instanceof Error ? error.message : 'Unable to load data from Supabase.';
  } finally {
    libraryLoading.value = false;
  }
}

async function persistLibrary(): Promise<boolean> {
  if (!libraryReady.value || props.localOnly) return false;
  try {
    await saveLibraryToSupabase(props.userId, {
      tracks: tracks.value.map((track: MusicTrack) => ({ ...track, playlistIds: [...track.playlistIds] })),
      playlists: playlists.value.map((playlist: Playlist) => ({ ...playlist })),
    });
    return true;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to sync your library with Supabase.',
      position: 'bottom',
      timeout: 5000,
    });
    return false;
  }
}

function normalizeAudioMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function suggestTrackForAudioFile(file: File, unavailableTrackIds: Set<string>): string {
  const basename = file.name.replace(/\.[^.]+$/, '').replace(/^\s*\d+\s*[-_. ]*/, '');
  const filename = normalizeAudioMatch(basename);
  if (!filename) return '';

  const candidates = tracksNeedingAudio.value
    .filter((track) => !unavailableTrackIds.has(track.id))
    .map((track) => {
      const title = normalizeAudioMatch(track.title);
      const artist = normalizeAudioMatch(track.artist);
      const combined = [`${artist}${title}`, `${title}${artist}`];
      const score = filename === title || combined.includes(filename)
        ? 3
        : filename.startsWith(title) || combined.some((name) => name && filename.startsWith(name))
          ? 2
          : title.length >= 5 && filename.includes(title)
            ? 1
            : 0;
      return { id: track.id, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!candidates.length || (candidates[1] && candidates[0]!.score === candidates[1].score)) return '';
  return candidates[0]!.id;
}

function openBulkAudioDialog() {
  if (props.localOnly) {
    $q.notify({ type: 'warning', message: 'Sign in and configure Supabase Storage to attach audio.', position: 'bottom' });
    return;
  }
  if (!bulkAudioNeedsSync.value) {
    bulkAudioAssignments.value = [];
    bulkAudioProgress.value = 0;
  }
  bulkAudioDialogOpen.value = true;
}

function selectBulkAudioFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  const accepted = files.filter((file) => file.size > 0 && file.size <= maxAudioFileSize);
  const invalidFiles = files.filter((file) => file.size === 0 || file.size > maxAudioFileSize);
  if (invalidFiles.length) {
    $q.notify({
      type: 'warning',
      message: `${invalidFiles.length} file(s) were skipped because they are empty or larger than 50 MB.`,
      position: 'bottom',
      timeout: 5000,
    });
  }
  const unavailableTrackIds = new Set(bulkAudioAssignments.value.map((assignment) => assignment.trackId).filter(Boolean));
  bulkAudioAssignments.value.push(...accepted.map((file) => {
    const trackId = suggestTrackForAudioFile(file, unavailableTrackIds);
    if (trackId) unavailableTrackIds.add(trackId);
    return { file, trackId };
  }));
}

function bulkAudioOptionsFor(assignmentIndex: number) {
  const currentTrackId = bulkAudioAssignments.value[assignmentIndex]?.trackId;
  const alreadyAssigned = new Set(
    bulkAudioAssignments.value
      .filter((_, index) => index !== assignmentIndex)
      .map((assignment) => assignment.trackId)
      .filter(Boolean),
  );
  const trackOptions = new Map<string, MusicTrack>();
  tracksNeedingAudio.value.forEach((track) => trackOptions.set(track.id, track));
  const selectedTrack = tracks.value.find((track) => track.id === currentTrackId);
  if (selectedTrack) trackOptions.set(selectedTrack.id, selectedTrack);
  return [...trackOptions.values()]
    .filter((track) => track.id === currentTrackId || !alreadyAssigned.has(track.id))
    .map((track) => ({ label: `${track.title} — ${track.artist}`, value: track.id }));
}

function removeBulkAudioFile(index: number) {
  bulkAudioAssignments.value.splice(index, 1);
}

async function uploadBulkAudio() {
  if (!canUploadBulkAudio.value) return;
  uploadingBulkAudio.value = true;
  bulkAudioProgress.value = 0;
  if (bulkAudioNeedsSync.value) {
    try {
      if (librarySaveTimer) clearTimeout(librarySaveTimer);
      librarySaveTimer = undefined;
      const synced = await persistLibrary();
      if (!synced) return;
      bulkAudioNeedsSync.value = false;
      try {
        storageAudioStatuses.value = await verifyTrackAudioPaths(tracks.value);
      } catch (error) {
        $q.notify({
          type: 'warning',
          message: error instanceof Error ? `Audio links were saved, but Storage verification failed: ${error.message}` : 'Audio links were saved, but Storage verification failed.',
          position: 'bottom',
        });
      }
      if (bulkAudioAssignments.value.length) {
        $q.notify({ type: 'warning', message: 'Saved the uploaded audio links. Failed files remain selected so you can retry them.', position: 'bottom' });
      } else {
        $q.notify({ type: 'positive', message: 'Audio links saved to your library.', position: 'bottom' });
        bulkAudioDialogOpen.value = false;
      }
    } catch (error) {
      $q.notify({
        type: 'warning',
        message: error instanceof Error ? `Audio links were saved, but Storage verification failed: ${error.message}` : 'Audio links were saved, but Storage verification failed.',
        position: 'bottom',
      });
    } finally {
      uploadingBulkAudio.value = false;
    }
    return;
  }

  const failures: string[] = [];
  const failedAssignments: typeof bulkAudioAssignments.value = [];
  const assignments = [...bulkAudioAssignments.value];
  let uploadedCount = 0;
  try {
    for (const assignment of assignments) {
      const track = tracks.value.find((item) => item.id === assignment.trackId);
      if (!track) {
        failures.push(`${assignment.file.name}: selected song no longer exists`);
        failedAssignments.push(assignment);
        bulkAudioProgress.value += 1;
        continue;
      }
      try {
        const uploadedAudio = await uploadTrackAudio(props.userId, assignment.file);
        track.audioPath = uploadedAudio.path;
        track.audioUrl = '';
        track.isSeeded = false;
        uploadedCount += 1;
      } catch (error) {
        failures.push(`${assignment.file.name}: ${error instanceof Error ? error.message : 'upload failed'}`);
        failedAssignments.push(assignment);
      }
      bulkAudioProgress.value += 1;
    }

    if (!uploadedCount) {
      $q.notify({
        type: 'negative',
        message: failures.slice(0, 2).join('; ') || 'No audio files were uploaded.',
        position: 'bottom',
        timeout: 7000,
      });
      return;
    }

    bulkAudioAssignments.value = failedAssignments;
    bulkAudioNeedsSync.value = true;
    if (librarySaveTimer) clearTimeout(librarySaveTimer);
    librarySaveTimer = undefined;
    const synced = await persistLibrary();
    if (!synced) {
      $q.notify({
        type: 'negative',
        message: `${uploadedCount} file(s) reached Storage, but their song links could not be saved to the library. Keep this page open and retry after checking your connection.`,
        position: 'bottom',
        timeout: 8000,
      });
      return;
    }
    bulkAudioNeedsSync.value = false;

    try {
      storageAudioStatuses.value = await verifyTrackAudioPaths(tracks.value);
    } catch (error) {
      $q.notify({
        type: 'warning',
        message: error instanceof Error ? `Audio was attached, but Storage verification failed: ${error.message}` : 'Audio was attached, but Storage verification failed.',
        position: 'bottom',
        timeout: 6000,
      });
    }

    const failureSummary = failures.length
      ? ` ${failures.length} failed: ${failures.slice(0, 2).join('; ')}${failures.length > 2 ? `; ${failures.length - 2} additional failed file(s) remain selected for retry` : '; failed file remains selected for retry'}`
      : '';
    $q.notify({
      type: failures.length ? 'warning' : 'positive',
      message: `Audio attached to ${uploadedCount} existing song(s).${failureSummary}`,
      position: 'bottom',
      timeout: 8000,
    });
    if (!failures.length) bulkAudioDialogOpen.value = false;
  } finally {
    uploadingBulkAudio.value = false;
  }
}

function setView(view: string) {
  activeView.value = view;
  profileMenu.value = false;
  if (window.matchMedia('(max-width: 700px)').matches) sidebarOpen.value = false;
  if (view !== 'Search') searchQuery.value = '';
}

function openSearch() {
  activeView.value = 'Search';
  searchCategory.value = 'Songs';
}

function selectCollectionCategory(category: string) {
  if (activeView.value === 'Search') searchCategory.value = category;
  else libraryCategory.value = category;
}

function openArtistSearch(artist: string) {
  activeView.value = 'Search';
  searchCategory.value = 'Songs';
  searchQuery.value = artist;
}

function openAlbumSearch(album: string) {
  activeView.value = 'Search';
  searchCategory.value = 'Songs';
  searchQuery.value = album;
}

function openTrackDialog() {
  selectedPlaylistId.value = activePlaylist.value?.id || null;
  selectedAudioFile.value = null;
  if (audioFileInput.value) audioFileInput.value.value = '';
  trackDialogOpen.value = true;
}

function selectAudioFile(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const file = input.files?.[0] || null;
  if (!file) return;
  const hasAudioType = file.type.startsWith('audio/');
  const hasAudioExtension = /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|webm)$/i.test(file.name);
  if (!hasAudioType && !hasAudioExtension) {
    selectedAudioFile.value = null;
    input.value = '';
    $q.notify({ type: 'warning', message: 'Choose a supported audio file.', position: 'bottom' });
    return;
  }
  if (file.size > maxAudioFileSize) {
    selectedAudioFile.value = null;
    input.value = '';
    $q.notify({ type: 'warning', message: 'Audio files must be 50 MB or smaller.', position: 'bottom' });
    return;
  }
  selectedAudioFile.value = file;
  if (!trackForm.title?.trim()) {
    trackForm.title = file.name.replace(/\.[^.]+$/, '');
  }
  const previewUrl = URL.createObjectURL(file);
  const metadataAudio = new Audio();
  metadataAudio.preload = 'metadata';
  metadataAudio.onloadedmetadata = () => {
    if (selectedAudioFile.value === file && Number.isFinite(metadataAudio.duration)) {
      trackForm.duration = formatDuration(metadataAudio.duration);
    }
    URL.revokeObjectURL(previewUrl);
  };
  metadataAudio.onerror = () => URL.revokeObjectURL(previewUrl);
  metadataAudio.src = previewUrl;
}

function clearSelectedAudio() {
  selectedAudioFile.value = null;
  if (audioFileInput.value) audioFileInput.value.value = '';
}

function toggleTheme() {
  darkMode.value = !darkMode.value;
  localStorage.setItem('sonora-theme', darkMode.value ? 'dark' : 'light');
  $q.dark.set(darkMode.value);
}

function playTrack(track: MusicTrack) {
  const currentIndex = filteredTracks.value.findIndex((item) => item.id === track.id);
  if (currentIndex >= 0) queue.value = filteredTracks.value.slice(currentIndex + 1);
  if (playingTrack.value?.id === track.id) isPlaying.value = !isPlaying.value;
  else {
    playingTrack.value = track;
    isPlaying.value = true;
    elapsedSeconds.value = 0;
    progress.value = 0;
  }
  if (playingTrack.value?.id === track.id && isPlaying.value) {
    listeningHistory.value = [
      { trackId: track.id, playedAt: new Date().toISOString() },
      ...listeningHistory.value.filter((item) => item.trackId !== track.id),
    ].slice(0, 50);
    saveListeningHistory(props.userId, listeningHistory.value);
  }
}

function onAudioTimeUpdate() {
  const audio = audioElement.value;
  if (!audio) return;
  audioCurrentTime.value = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  elapsedSeconds.value = Math.floor(audioCurrentTime.value);
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    progress.value = (audio.currentTime / audio.duration) * 100;
  }
}

function onAudioMetadata() {
  const audio = audioElement.value;
  if (!audio) return;
  audioDurationSeconds.value = Number.isFinite(audio.duration) ? audio.duration : 0;
  onAudioTimeUpdate();
}

function onAudioPlay() {
  isBuffering.value = false;
  isPlaying.value = true;
}

function onAudioPause() {
  isBuffering.value = false;
}

function onAudioEnded() {
  stepTrack(1, true);
}

function seekTrack() {
  if (youtubePlayer) {
    const duration = youtubePlayer.getDuration();
    if (!Number.isFinite(duration) || duration <= 0) return;
    const currentTime = (progress.value / 100) * duration;
    youtubePlayer.seekTo(currentTime, true);
    audioCurrentTime.value = currentTime;
    elapsedSeconds.value = Math.floor(currentTime);
    return;
  }
  const audio = audioElement.value;
  if (!audio || !Number.isFinite(audio.duration)) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
  audioCurrentTime.value = audio.currentTime;
  elapsedSeconds.value = Math.floor(audio.currentTime);
}

function isAbortError(error: unknown): boolean {
  return typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError';
}

async function retryStorageAudio(track: MusicTrack, position: number, generation: number): Promise<boolean> {
  const audio = audioElement.value;
  if (!audio || !track.audioPath || storageRefreshAttemptedTrackId === track.id) return false;
  storageRefreshAttemptedTrackId = track.id;
  try {
    const source = await resolveTrackAudioSource(track);
    if (generation !== playbackGeneration || playingTrack.value?.id !== track.id || !isPlaying.value) return true;
    await new Promise<void>((resolve, reject) => {
      const cleanUp = () => {
        audio.removeEventListener('loadedmetadata', onMetadata);
        audio.removeEventListener('error', onError);
      };
      const onMetadata = () => {
        cleanUp();
        resolve();
      };
      const onError = () => {
        cleanUp();
        reject(new Error('The refreshed Storage audio URL could not load the file.'));
      };
      audio.addEventListener('loadedmetadata', onMetadata, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.src = source;
      audio.load();
    });
    if (generation !== playbackGeneration || playingTrack.value?.id !== track.id || !isPlaying.value) return true;
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(position, audio.duration);
    }
    await audio.play();
    return true;
  } catch (error) {
    if (generation === playbackGeneration && !isAbortError(error)) reportPlaybackFailure(track, error);
    return true;
  }
}

function reportPlaybackFailure(track: MusicTrack, error?: unknown) {
  isBuffering.value = false;
  if (playbackFailureNotifiedTrackId === track.id) return;
  playbackFailureNotifiedTrackId = track.id;
  isPlaying.value = false;

  const status = storageAudioStatuses.value.find((item) => item.trackId === track.id);
  const mediaErrorCode = audioElement.value?.error?.code;
  let message: string;
  const isCatalogTrack = track.isSeeded || isDemoCatalogTrack(track.title, track.artist);
  const missingCatalogAudio =
    isCatalogTrack &&
    !track.audioPath &&
    !getYouTubeVideoId(track.audioUrl) &&
    !resolveTrackAudioUrl(track.audioUrl);
  if (missingCatalogAudio) {
    message = `No original recording is linked for “${track.title}”. Search YouTube or add an authorized audio file.`;
  } else if (status?.status === 'missing') {
    message = `Audio file for “${track.title}” is missing from the music bucket.`;
  } else if (status?.status === 'wrong-bucket') {
    message = `Audio for “${track.title}” is not stored in the music bucket.`;
  } else if (error instanceof Error && error.message) {
    message = error.message;
  } else if (mediaErrorCode === 3) {
    message = `The audio file for “${track.title}” is corrupt or uses an unsupported codec.`;
  } else if (mediaErrorCode === 4) {
    message = track.audioPath
      ? `Storage audio for “${track.title}” could not be decoded or loaded. Check that the file exists, your access policy allows it, and its codec is browser-supported.`
      : `The direct audio URL for “${track.title}” returned an unsupported source or format. Check that it points to an audio file.`;
  } else if (mediaErrorCode === 2 && track.audioPath) {
    message = `Audio request failed for “${track.title}” after refreshing its Storage URL. Check that the file exists and the music bucket SELECT policy allows your account.`;
  } else if (mediaErrorCode === 2) {
    message = `The direct audio URL for “${track.title}” could not be loaded. Check the URL, network, and host permissions.`;
  } else {
    message = `Could not start “${track.title}”. Check its audio file and Storage permissions.`;
  }
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'NotAllowedError') {
    message = 'Your browser blocked playback. Press Play again to allow audio.';
  }
  $q.notify({
    type: 'negative',
    message,
    position: 'bottom',
    timeout: 6000,
    ...(missingCatalogAudio
      ? {
          actions: [
            {
              label: 'Search YouTube',
              color: 'white',
              handler: () => {
                const query = encodeURIComponent(
                  `${getArtistDisplayName(track)} ${track.title} official audio`,
                );
                window.open(
                  `https://www.youtube.com/results?search_query=${query}`,
                  '_blank',
                  'noopener,noreferrer',
                );
              },
            },
          ],
        }
      : {}),
  });
}

function handleAudioError() {
  const audio = audioElement.value;
  const track = playingTrack.value;
  isBuffering.value = false;
  if (!audio || !track || !isPlaying.value) return;
  if (audio.error?.code === 2 && track.audioPath) {
    void retryStorageAudio(track, audio.currentTime, playbackGeneration);
    return;
  }
  reportPlaybackFailure(track);
}

function togglePlayback() {
  if (!playingTrack.value) {
    const firstTrack = filteredTracks.value[0];
    if (firstTrack) playTrack(firstTrack);
    return;
  }
  isPlaying.value = !isPlaying.value;
}

function stepTrack(direction: number, trackEnded = false) {
  if (direction < 0 && elapsedSeconds.value > 3) {
    elapsedSeconds.value = 0;
    progress.value = 0;
    if (youtubePlayer) {
      youtubePlayer.seekTo(0, true);
      return;
    }
    if (audioElement.value) {
      audioElement.value.currentTime = 0;
    }
    return;
  }
  if (direction > 0 && trackEnded && repeatOn.value && playingTrack.value) {
    elapsedSeconds.value = 0;
    progress.value = 0;
    if (youtubePlayer) {
      youtubePlayer.seekTo(0, true);
      youtubePlayer.playVideo();
      return;
    }
    if (audioElement.value) {
      audioElement.value.currentTime = 0;
      audioCurrentTime.value = 0;
      void audioElement.value.play().catch(async (error: unknown) => {
        const track = playingTrack.value;
        if (!track || isAbortError(error)) return;
        if (track.audioPath) {
          const refreshed = await retryStorageAudio(track, 0, playbackGeneration);
          if (refreshed) return;
        }
        reportPlaybackFailure(track, error);
      });
    }
    return;
  }
  if (direction > 0 && queue.value.length) {
    const nextIndex = shuffleOn.value ? Math.floor(Math.random() * queue.value.length) : 0;
    const [nextTrack] = queue.value.splice(nextIndex, 1);
    if (nextTrack) {
      playingTrack.value = nextTrack;
      isPlaying.value = true;
      elapsedSeconds.value = 0;
      progress.value = 0;
      listeningHistory.value = [
        { trackId: nextTrack.id, playedAt: new Date().toISOString() },
        ...listeningHistory.value.filter((item) => item.trackId !== nextTrack.id),
      ].slice(0, 50);
      saveListeningHistory(props.userId, listeningHistory.value);
    }
    return;
  }
  const list = filteredTracks.value.length ? filteredTracks.value : tracks.value;
  if (!list.length) return;
  const currentIndex = list.findIndex((track) => track.id === playingTrack.value?.id);
  let nextIndex: number;
  if (direction > 0 && shuffleOn.value && list.length > 1) {
    const candidates = list.map((_, index) => index).filter((index) => index !== currentIndex);
    nextIndex = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
  } else {
    nextIndex = (currentIndex + direction + list.length) % list.length;
  }
  const nextTrack = list[nextIndex];
  if (nextTrack) playTrack(nextTrack);
}

function playFeatured() {
  const featured = tracks.value.find((track: MusicTrack) => track.mood === 'Chill') || tracks.value[0];
  if (featured) playTrack(featured);
}

function playMood(mood: string) {
  const match = tracks.value.find((track: MusicTrack) => track.mood === mood);
  if (match) playTrack(match);
  else $q.notify({ message: `Your ${mood.toLowerCase()} mix is being tuned.`, position: 'bottom', timeout: 1800 });
}

function playHomeMood(mood: string | null) {
  selectedMood.value = mood;
  if (mood) {
    playMood(mood);
  }
}

function scrollListenAgain(direction: -1 | 1) {
  listenAgainRow.value?.scrollBy({ left: direction * 360, behavior: 'smooth' });
}

function toggleFavorite(track: MusicTrack) {
  const found = tracks.value.find((item: MusicTrack) => item.id === track.id);
  if (!found) return;
  found.is_favorite = !found.is_favorite;
  if (playingTrack.value?.id === found.id) playingTrack.value = { ...found };
}

function getArtistDisplayName(track: MusicTrack): string {
  return track.artist.trim() || 'Unknown artist';
}

function removeArtistCredit(track: MusicTrack) {
  const found = tracks.value.find((item) => item.id === track.id);
  if (!found || !found.artist.trim()) return;
  found.artist = '';
  if (playingTrack.value?.id === found.id) playingTrack.value = { ...found };
  $q.notify({
    message: `Artist credit removed from “${found.title}”. The song is still in your library.`,
    position: 'bottom',
    timeout: 2500,
  });
}

function linkYouTubeVideo(track: MusicTrack) {
  $q.dialog({
    title: 'Link YouTube video',
    message: `Paste the YouTube video URL for “${track.title}”. Playback uses YouTube's embedded player.`,
    prompt: {
      model: track.audioUrl || '',
      type: 'url',
      isValid: (value: string) => Boolean(getYouTubeVideoId(value)),
    },
    cancel: true,
    persistent: true,
  }).onOk((value: string) => {
    const videoUrl = value.trim();
    if (!getYouTubeVideoId(videoUrl)) {
      $q.notify({ type: 'warning', message: 'Enter a valid YouTube video URL.', position: 'bottom' });
      return;
    }

    const updatedTrack = { ...track, audioUrl: videoUrl, isSeeded: true };
    tracks.value = tracks.value.map((item) =>
      item.id === track.id ? updatedTrack : item,
    );
    if (playingTrack.value?.id === track.id) {
      playingTrack.value = updatedTrack;
      isPlaying.value = true;
    }
    $q.notify({ message: 'YouTube video linked to this song', position: 'bottom', timeout: 1800 });
  });
}

function addToQueue(track: MusicTrack) {
  if (!playingTrack.value) {
    playTrack(track);
    return;
  }
  queue.value.push(track);
  $q.notify({ message: `${track.title} added to your queue`, position: 'bottom', timeout: 1600 });
}

function toggleTrackInPlaylist(track: MusicTrack, playlist: Playlist) {
  const found = tracks.value.find((item) => item.id === track.id);
  if (!found) return;
  const isInPlaylist = found.playlistIds.includes(playlist.id);
  found.playlistIds = isInPlaylist
    ? found.playlistIds.filter((playlistId) => playlistId !== playlist.id)
    : [...found.playlistIds, playlist.id];
  $q.notify({
    message: isInPlaylist
      ? `Removed ${found.title} from ${playlist.name}`
      : `Added ${found.title} to ${playlist.name}`,
    position: 'bottom',
    timeout: 1600,
  });
}

function removeTrack(track: MusicTrack) {
  tracks.value = tracks.value.filter((item: MusicTrack) => item.id !== track.id);
  queue.value = queue.value.filter((item) => item.id !== track.id);
  if (playingTrack.value?.id === track.id) {
    playingTrack.value = null;
    isPlaying.value = false;
  }
  if (!props.localOnly) {
    void deleteTrackFromSupabase(track.id);
  }
  if (track.audioPath && !props.localOnly) {
    void deleteTrackAudio(track.audioPath, track.audioUrl).catch((error: unknown) => {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Unable to delete uploaded audio.',
        position: 'bottom',
      });
    });
  }
  $q.notify({ message: 'Removed from your library', position: 'bottom', timeout: 1600 });
}

function playQueuedTrack(index: number) {
  const [track] = queue.value.splice(index, 1);
  if (!track) return;
  if (playingTrack.value?.id === track.id) {
    const audio = audioElement.value;
    if (audio) audio.currentTime = 0;
    audioCurrentTime.value = 0;
    elapsedSeconds.value = 0;
    progress.value = 0;
    isPlaying.value = true;
    return;
  }
  playingTrack.value = track;
  isPlaying.value = true;
  elapsedSeconds.value = 0;
  progress.value = 0;
  listeningHistory.value = [
    { trackId: track.id, playedAt: new Date().toISOString() },
    ...listeningHistory.value.filter((item) => item.trackId !== track.id),
  ].slice(0, 50);
  saveListeningHistory(props.userId, listeningHistory.value);
}

function removeFromQueue(index: number) {
  queue.value.splice(index, 1);
}

function clearQueue() {
  queue.value = [];
}

function clearListeningHistory() {
  listeningHistory.value = [];
  saveListeningHistory(props.userId, []);
}

async function createTrack() {
  const file = selectedAudioFile.value;
  const submittedAudioUrl = trackForm.audioUrl?.trim() || '';
  const hasUrl = Boolean(submittedAudioUrl);
  if (!file && !hasUrl) {
    $q.notify({ type: 'warning', message: 'Choose an audio file or enter a direct audio URL.', position: 'bottom' });
    return;
  }
  if (!trackForm.title?.trim() || !trackForm.artist?.trim()) return;
  if (hasUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(submittedAudioUrl);
    } catch {
      $q.notify({ type: 'warning', message: 'Enter a valid direct audio URL.', position: 'bottom' });
      return;
    }
    if (
      !getYouTubeVideoId(submittedAudioUrl) &&
      !['http:', 'https:'].includes(parsedUrl.protocol)
    ) {
      $q.notify({ type: 'warning', message: 'Enter a direct HTTP(S) audio URL or a supported YouTube video link.', position: 'bottom' });
      return;
    }
  }
  if (file && props.localOnly) {
    $q.notify({
      type: 'warning',
      message: 'Audio uploads need a signed-in account and configured Supabase Storage.',
      position: 'bottom',
    });
    return;
  }
  uploadingTrack.value = true;
  try {
    let audioUrl = submittedAudioUrl;
    let audioPath = '';
    if (file) {
      const uploadedAudio = await uploadTrackAudio(props.userId, file);
      audioUrl = '';
      audioPath = uploadedAudio.path;
    }
    const created = makeTrack(
      {
        ...trackForm,
        audioPath,
        audioUrl,
      },
      selectedPlaylistId.value || undefined,
    );
    tracks.value.unshift(created);
    trackForm.title = '';
    trackForm.artist = '';
    trackForm.album = '';
    trackForm.coverUrl = '';
    trackForm.audioUrl = '';
    trackForm.duration = '0:00';
    trackForm.genre = 'Indie';
    trackForm.mood = 'Chill';
    trackForm.lyricsText = '';
    trackForm.lyricsLrc = '';
    selectedAudioFile.value = null;
    if (audioFileInput.value) audioFileInput.value.value = '';
    trackDialogOpen.value = false;
    $q.notify({ message: 'Music added to your library', position: 'bottom', timeout: 1800 });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to add music.',
      position: 'bottom',
      timeout: 5000,
    });
  } finally {
    uploadingTrack.value = false;
  }
}

function openNewPlaylist() {
  if (window.matchMedia('(max-width: 700px)').matches) sidebarOpen.value = false;
  editingPlaylistId.value = null;
  playlistName.value = '';
  playlistCoverUrl.value = '';
  playlistDialogOpen.value = true;
}

function openPlaylistEditor(playlist: Playlist) {
  editingPlaylistId.value = playlist.id;
  playlistName.value = playlist.name;
  playlistCoverUrl.value = playlist.coverUrl;
  playlistDialogOpen.value = true;
}

function savePlaylist() {
  const name = playlistName.value.trim();
  if (!name) return;
  const duplicate = playlists.value.find(
    (playlist) =>
      playlist.id !== editingPlaylistId.value &&
      playlist.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
  );
  if (duplicate) {
    $q.notify({ type: 'warning', message: 'A playlist with that name already exists.', position: 'bottom' });
    return;
  }
  if (editingPlaylistId.value) {
    const playlist = playlists.value.find((item) => item.id === editingPlaylistId.value);
    if (!playlist) {
      $q.notify({ type: 'negative', message: 'This playlist could not be found.', position: 'bottom' });
      return;
    }
    const previousName = playlist.name;
    playlist.name = name;
    playlist.coverUrl = playlistCoverUrl.value.trim() || playlist.coverUrl;
    if (activeView.value === previousName) activeView.value = name;
    $q.notify({ message: 'Playlist updated', position: 'bottom', timeout: 1600 });
  } else {
    const coverUrl =
      playlistCoverUrl.value.trim() ||
      tracks.value[playlists.value.length % Math.max(tracks.value.length, 1)]?.coverUrl ||
      defaultCover;
    playlists.value.unshift({ id: crypto.randomUUID(), name, coverUrl });
    activeView.value = name;
    $q.notify({ message: 'Playlist created', position: 'bottom', timeout: 1600 });
  }
  playlistName.value = '';
  playlistCoverUrl.value = '';
  editingPlaylistId.value = null;
  playlistDialogOpen.value = false;
}

function deletePlaylistById(playlistId: string) {
  deletePlaylist(playlistId);
}

function deletePlaylist(playlistId = editingPlaylistId.value) {
  if (!playlistId) return;
  const playlist = playlists.value.find((item) => item.id === playlistId);
  if (!playlist) {
    $q.notify({ type: 'negative', message: 'This playlist could not be found.', position: 'bottom' });
    return;
  }
  $q.dialog({
    title: 'Delete playlist?',
    message: `“${playlist.name}” will be removed from your library. Your songs will not be deleted.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    playlists.value = playlists.value.filter((item) => item.id !== playlistId);
    tracks.value = tracks.value.map((track) => ({
      ...track,
      playlistIds: track.playlistIds.filter((id) => id !== playlistId),
    }));
    if (!props.localOnly) {
      void deletePlaylistFromSupabase(playlistId);
    }
    if (activeView.value === playlist.name) activeView.value = 'Your Library';
    editingPlaylistId.value = null;
    playlistDialogOpen.value = false;
    $q.notify({ message: 'Playlist deleted', position: 'bottom', timeout: 1600 });
  });
}

function filterByGenre(genre: string) {
  activeView.value = 'Browse';
  searchQuery.value = genre;
}

function onShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
    document.querySelector<HTMLInputElement>('.global-search input')?.focus();
  }
  if (event.code === 'Space' && !(event.target instanceof HTMLInputElement)) {
    event.preventDefault();
    togglePlayback();
  }
}

function onEscKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && expandedPlayerOpen.value && !youtubeVideoId.value) {
    expandedPlayerOpen.value = false;
  }
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}
</script>

<style scoped>
.ep-youtube-player {
  display: block;
  position: relative;
  width: min(560px, 100%);
  min-height: 200px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 16px;
  background: #000;
}

.ep-youtube-player :deep(iframe) {
  width: 100%;
  height: 100%;
}
</style>