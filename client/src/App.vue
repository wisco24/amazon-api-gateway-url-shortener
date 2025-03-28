
<template>
  <div id="app">
    <section class="section">
      <nav
        class="navbar is-fixed-top is-dark"
        role="navigation"
        aria-label="main navigation"
      >
        <div class="navbar-brand">
          <div class="navbar-item">
            <h1 class="title has-text-white">{{ appName }}</h1>
          </div>
          <a
            role="button"
            class="navbar-burger burger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbarCollapse"
            v-bind:class="{ 'is-active': isOpen }"
            @click="isOpen = !isOpen"
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div
          id="navbarCollapse"
          class="navbar-menu"
          v-bind:class="{ 'is-active': isOpen }"
        >
          <div class="navbar-start">
            <!-- <router-link class="navbar-item" to="/">Dashboard</router-link> -->
          </div>

          <div class="navbar-end">
            <a
              class="navbar-item"
              v-if="authorized"
              v-on:click="logout()"
              v-bind:href="logOutUrl"
              >Log Out</a
            >
            <a class="navbar-item" v-if="!authorized" v-bind:href="signUpUrl"
              >Sign up</a
            >
            <a class="navbar-item" v-if="!authorized" v-bind:href="logInUrl"
              >Log in</a
            >
          </div>
        </div>
      </nav>
    </section>
    <section class="section">
      <div class="container">
        <div v-if="authorized">
          <router-view />
        </div>
        <div v-else>
          <h1 class="title">Welcome to {{ appName }}</h1>
          <h2 class="subtitle">The Trend Micro Consumer Product URL System.</h2>
          <p v-if="linkNotFound">
            We're sorry, that link could not be found.
            <a v-bind:href="signUpUrl">Sign up</a> or
            <a v-bind:href="logInUrl">Log in</a> to register it?
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";

// Set Cognito Vars
const clientId = process.env.VUE_APP_CLIENT_ID;
const authDomain = process.env.VUE_APP_AUTH_DOMAIN;
const queryStringParams = new URLSearchParams(window.location.search);
const cognitoCode = queryStringParams.get("code") || null;
const lnf = queryStringParams.get("lnf") || null;
const redUrl = window.location.origin;

export default {
  name: "app",
  data() {
    return {
      appName: `Trend Consumer Product URL Tool`,
      signUpUrl: `${authDomain}/signup?response_type=code&client_id=${clientId}&redirect_uri=${redUrl}`,
      logInUrl: `${authDomain}/login?response_type=code&client_id=${clientId}&redirect_uri=${redUrl}`,
      logOutUrl: `${authDomain}/logout?client_id=${clientId}&logout_uri=${redUrl}`,
      linkNotFound: lnf,
      isOpen: false,
    };
  },
  created() {
    if (cognitoCode) this.exchangeToken();
    else this.exchangeRefreshToken();
  },
  methods: {
    convertJSON: function (json) {
      const oAuthTokenBodyArray = Object.entries(json).map(([key, value]) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(value);
        return `${encodedKey}=${encodedValue}`;
      });
      return oAuthTokenBodyArray.join("&");
    },
    exchangeRefreshToken: function () {
      const oauthTokenBodyJson = {
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: localStorage.getItem("cognitoRefreshToken"),
      };
      const oauthTokenBody = this.convertJSON(oauthTokenBodyJson);

      if (oauthTokenBodyJson.refresh_token) {
        return axios
          .post(`${authDomain}/oauth2/token`, oauthTokenBody, {
            ["Content-Type"]: "application/x-www-form-urlencoded",
          })
          .then((response) => {
            let json = response.data;
            if (json.id_token) {
              localStorage.setItem("cognitoIdentityToken", json.id_token);
              this.$store.commit("authorize");
            }
          })
          .catch(() => {
            this.$store.commit("deAuthorize");
          });
      } else {
        return new Promise((res) => {
          return res({});
        });
      }
    },
    exchangeToken: function () {
      const oauthTokenBodyJson = {
        grant_type: "authorization_code",
        client_id: clientId,
        code: cognitoCode,
        redirect_uri: redUrl,
      };
      const oauthTokenBody = this.convertJSON(oauthTokenBodyJson);

      return axios
        .post(`${authDomain}/oauth2/token`, oauthTokenBody, {
          ["Content-Type"]: "application/x-www-form-urlencoded",
        })
        .then((response) => {
          let json = response.data;
          if (json.id_token) {
            localStorage.setItem("cognitoIdentityToken", json.id_token);
            localStorage.setItem("cognitoRefreshToken", json.refresh_token);
            this.$store.commit("authorize");
          }
          let query = Object.assign({}, this.$route.query);
          delete query.code;
          this.$router.replace({ query });
        })
        .catch(() => {
          this.$store.commit("deAuthorize");
        });
    },
    logout: function () {
      localStorage.setItem("cognitoIdentityToken", null);
      localStorage.setItem("cognitoRefreshToken", null);
    },
  },
  computed: {
    ...mapState(["authorized"]),
  },
};
</script>
