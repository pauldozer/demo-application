// Highlight active question in sidebar
window.dash_clientside = Object.assign({}, window.dash_clientside, {
  ui: {
    highlight_active: function(qid) {
      document.querySelectorAll('.q-nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.id && el.id.includes(qid)) el.classList.add('active');
      });
      // find by data or matching span text
      document.querySelectorAll('.q-nav-item').forEach(el => {
        const badge = el.querySelector('.q-nav-id');
        if (badge && badge.textContent.trim() === qid) {
          el.classList.add('active');
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
      return window.dash_clientside.no_update;
    }
  }
});
