<template lang="pug">
.page
  .page__container(v-show="!$fetchState.pending && !$fetchState.error")
    .page__row
      .page__col
        h1 London COVID-19 Timeline
    .page__row
      .page__col
        .u--position_sticky
          h2(v-if="fromDate") {{fromDate.add(offsetDate, 'days')}}
          div
            input(type="radio" id="new" :value="false" v-model="cumulative")
            label(for="new") New cases
            input(type="radio" id="total" :value="true" v-model="cumulative")
            label(for="total") Total cases
          .controls
            .controls__range-wrapper
              input(type="range", v-model.number="offsetDate", min="0", :max="totalDays", @focus="handleStop()").u--w_100.controls__range
            .controls_buttons-wrapper
              button(@click="offsetDate = 0").controls_button &lt;
              button(@click="handleToggle()").controls_button {{playingState ? 'pause' : 'play'}}
              button(@click="offsetDate = totalDays").controls_button &gt;
          div(@click="$store.commit('clearArea')")
            LondonMap(ref="map")
      .page__col
        div
          h2 Introduction
          p Data sourced from <a href="https://data.london.gov.uk/dataset/coronavirus--covid-19--cases">London Datastore</a>
          p Statically generated site using NuxtJS, d3
        
        div
          h2 Table
          div
            table.u--w_100
              thead
                tr
                  th.u--align_left
                    button(@click="sortBy='name'", :disabled="sortBy==='name'") Sort
                    h3 Borough
                    
                  th.u--align_center
                    button(@click="sortBy='new';cumulative=false",:disabled="sortBy==='new'") Sort
                    h3 New Cases
                
                  th.u--align_center
                    button(@click="sortBy='total';cumulative=true",:disabled="sortBy==='total'") Sort
                    h3 Total Cases
                    
                tr
                  td
                    h4 All London
                  td.u--align_center
                    .t--large {{dailyNewest}}
                    .t--small new cases
                  td.u--align_center
                    .t--large {{dailyTotal}}
                    .t--small total cases

              TransitionGroup(name="flip-list" tag="tbody")
                tr(v-for="borough in boroughsBySort", :key="borough.areaCode", @click.stop="$store.commit('setArea', borough.areaCode)", :class="{'is-selected': $store.state.selectedArea === borough.areaCode}" :id="borough.areaCode")
                  td
                    h4 {{borough.rows[offsetDate].area_name}}
                  td.u--align_center
                    .t--large {{borough.rows[offsetDate].new_cases}}
                    .t--small new cases
                  td.u--align_center
                    .t--large {{borough.rows[offsetDate].total_cases}}
                    .t--small total cases
  .page__container(v-if="$fetchState.pending")
    .page__row
      .page__col
        pre Loading data...
  .page__container(v-if="$fetchState.error")
    .page__row
      .page__col
        pre There was an issue loading the data.



</template>

<script>
import _ from 'lodash' // todo: load specific functions
import dayjs from 'dayjs'
import * as d3 from 'd3' // todo: load specific functions

const LIMIT = 5000

export default {
  // run api calls client side.
  fetchOnServer: false,
  async fetch() {
    // todo: load all pages in progamatically.
    // each page of 5000 rows is ~150 days.
    const request1 = await this.$http.$get(
      `https://data.london.gov.uk/api/table/s8c9t_j4fs2?$limit=${LIMIT}`
    )

    const request2 = await this.$http.$get(
      `https://data.london.gov.uk/api/table/s8c9t_j4fs2?$limit=${LIMIT}&$offset=5000`
    )

    this.apiResponse = {
      rows: [...request1.rows, ...request2.rows],
    }

    this.fromDate = dayjs(this.apiResponse.rows[0].date)
    this.toDate = dayjs(
      this.apiResponse.rows[this.apiResponse.rows.length - 1].date
    )

    this.offsetDate = this.totalDays

    this.highestNewest = _.maxBy(this.apiResponse.rows, 'new_cases').new_cases
    this.highestTotal = _.maxBy(
      this.apiResponse.rows,
      'total_cases'
    ).total_cases

    // push data to svg elements
    const svg = d3.select('#map')
    const data = []

    this.$refs.map.$el.querySelectorAll('.london__borough').forEach((el) => {
      data.push(this.boroughsByCode[el.dataset.key])
    })
    svg.selectAll('.london__borough').data(data).enter()

    // render the data on the map
    this.renderMap()
  },
  data() {
    return {
      apiResponse: null,
      offsetDate: 0,
      fromDate: null,
      toDate: null,
      cumulative: false,
      playingState: false,
      playingInterval: null,
      selectedArea: null,
      sortBy: 'name',
      highestNewest: 0,
      highestTotal: 0,
    }
  },
  computed: {
    boroughsByCode() {
      if (!this.apiResponse) return {}
      return _.groupBy(this.apiResponse.rows, (row) => {
        return row.area_code
      })
    },
    boroughsBySort() {
      return Object.entries(this.boroughsByCode)
        .map((entry) => {
          return { areaCode: entry[0], rows: entry[1] }
        })
        .sort((a, b) => {
          switch (this.sortBy) {
            case 'new':
              return (
                b.rows[this.offsetDate].new_cases -
                a.rows[this.offsetDate].new_cases
              )
            case 'total':
              return (
                b.rows[this.offsetDate].total_cases -
                a.rows[this.offsetDate].total_cases
              )
            default:
              return (
                b.rows[this.offsetDate].area_name -
                a.rows[this.offsetDate].area_name
              )
          }
        })
    },
    boroughNameMap() {
      return _.mapValues(this.boroughsByCode, (borough) => {
        return borough[0].area_name
      })
    },
    totalDays() {
      return this.toDate && this.fromDate
        ? dayjs(this.toDate).diff(this.fromDate, 'days')
        : 0
    },
    dailyNewest() {
      return this.boroughsBySort.length
        ? this.boroughsBySort.reduce((total, borough) => {
            return total + borough.rows[this.offsetDate].new_cases
          }, 0)
        : 0
    },
    dailyTotal() {
      return this.boroughsBySort.length
        ? this.boroughsBySort.reduce((total, borough) => {
            return total + borough.rows[this.offsetDate].total_cases
          }, 0)
        : 0
    },
  },
  watch: {
    offsetDate() {
      this.renderMap()
    },
    cumulative() {
      this.renderMap()
    },
    '$store.state.selectedArea'() {
      if (!document || !this.$store.state.selectedArea) return
      document
        .querySelector(`#${this.$store.state.selectedArea}`)
        .scrollIntoView({ behaviour: 'smooth', block: 'center' })
    },
  },
  mounted() {},
  methods: {
    renderMap() {
      const svg = d3.select('#map')

      // const colorScale = d3
      //   .scaleLinear()
      //   .domain([0, this.cumulative ? this.highestTotal : this.highestNewest])
      //   .range(['#ffb6b6', '#600008'])
      //   .nice()

      const colorScale = d3
        .scaleQuantize()
        .domain([0, this.cumulative ? this.highestTotal : this.highestNewest])
        .range([
          '#ffb6b6',
          '#ff8080',
          '#ff4b4b',
          '#ff1515',
          '#f10808',
          '#e00404',
          '#ce0303',
          '#bb0202',
          '#8e0105',
          '#600008',
        ])

      svg.selectAll('.london__borough').style('fill', (d) => {
        const value = this.cumulative
          ? d[this.offsetDate].total_cases
          : d[this.offsetDate].new_cases

        // if cases are exactly 0, then use white
        return value ? colorScale(value) : '#fff'
      })
    },
    handleToggle() {
      if (!this.playingState) {
        this.playingState = true

        if (this.offsetDate === this.totalDays) {
          this.offsetDate = 0
        }

        this.playingInterval = setInterval(() => {
          this.offsetDate += 1

          if (this.offsetDate === this.totalDays) {
            this.offsetDate = this.totalDays
            this.handleStop()
          }
        }, 1000)
      } else {
        this.handleStop()
      }
    },
    handleStop() {
      this.playingState = false
      clearInterval(this.playingInterval)
    },
  },
}
</script>

<style lang="sass" scoped>
.flip-list-move
  transition: transform 0.25s ease

.page__container
  width: calc(100% - 100px)
  max-width: 1600px
  margin: 0 auto

.page__row
  display: flex
  flex-wrap: wrap

.page__col
  padding: 0 25px
  width: 100%
  @media (min-width: 1200px)
    width: 50%

.u--h_100
  height: 100%

.u--w_100
  width: 100%

.u--position_sticky
  position: sticky
  top: 0

.u--align_center
  text-align: center

.u--align_left
  text-align: left

.t--large
  font-size: 1.75em

.t--small
  font-size: 0.75em
  text-transform: uppercase
  letter-spacing: 0.05em


.controls

.controls__range-wrapper

.controls__range

.controls_buttons-wrapper
  display: flex
  justify-content: space-between

.controls_button
  display: block
  font-size: 2em






table
  border-collapse: collapse

thead
  background: #dddddd
  td
    position: sticky
    top: 0
    background: #262626
    color: white

tbody
  tr
    cursor: pointer

  tr:nth-child(even)
    background: #dddddd
  tr:nth-child(odd)
    background: #cecece

  tr.is-selected
    background: #eee
    // color: white
    border: 2px solid black

th, td
  padding: 5px 10px

th
  h3
    // margin: 0
  button
    display: block
    width: 100%
</style>
