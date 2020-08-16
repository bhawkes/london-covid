export const state = () => ({
  selectedArea: null,
})

export const mutations = {
  setArea(state, area) {
    state.selectedArea = area
  },
  clearArea(state) {
    state.selectedArea = null
  },
}
