<template lang="pug">
.page
  .page__container
    .page__row
      .page__col
        h1 London COVID-19 Visualisation
    .page__row
      .page__col
        LondonMap
      .page__col
        h2 Total Days
        pre {{boroughNameMap}}
        pre {{boroughsByCode}}
        pre {{covidata}}
</template>

<script>
import _ from 'lodash'

const LIMIT = 5000

export default {
  async fetch() {
    this.covidata = await this.$http.$get(
      // todo: if multiple pages, then load all pages
      `https://data.london.gov.uk/api/table/s8c9t_j4fs2?$limit=${LIMIT}`
    )
  },
  data() {
    return {
      covidata: null,
    }
  },
  computed: {
    boroughsByCode() {
      if (!this.covidata) return {}
      return _.groupBy(this.covidata.rows, (row) => {
        return row.area_code
      })
    },
    boroughNameMap() {
      return _.mapValues(this.boroughsByCode, (borough) => {
        return borough[0].area_name
      })
    },
  },
}
</script>

<style lang="sass" scoped>
.page__container
  max-width: 1600px
  margin: 0 auto

.page__row
  display: flex
  flex-wrap: wrap

.page__col
  width: 50%
</style>
