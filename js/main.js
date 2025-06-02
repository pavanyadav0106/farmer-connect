document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById("loading");
  
  function showLoading() {
    loading.classList.add("show");
  }
  
  function hideLoading() {
    loading.classList.remove("show");
  }

  document.querySelector('.overlay').addEventListener('click', () => {
    document.getElementById('weatherPopup').classList.remove('active');
    document.querySelector('.overlay').classList.remove('active');
  });
});