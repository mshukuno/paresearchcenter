(function () {
  var meta = document.querySelector('meta[name="site-base"]');
  var base = meta ? meta.getAttribute("content") || "" : "";
  var homePath = (base || "") + "/";
  var searchPath = (base || "") + "/search/";
  var PER_PAGE = 10;

  function pageUrl(path) {
    if (!path) {
      return homePath;
    }
    if (base && path.indexOf(base) === 0) {
      return path;
    }
    return (base || "") + path;
  }

  function readQuery() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("s") || params.get("q") || "").trim();
  }

  function readPage() {
    var params = new URLSearchParams(window.location.search);
    var paged = parseInt(params.get("paged") || params.get("page") || "1", 10);
    return paged > 0 ? paged : 1;
  }

  function isHomePage() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    var home = (base || "").replace(/\/+$/, "") || "";
    return path === home || path === home + "/index.html" || (!base && path === "");
  }

  function isSearchPage() {
    return /\/search\/?$/i.test(window.location.pathname);
  }

  function searchUrl(query, page) {
    var url = searchPath + "?s=" + encodeURIComponent(query);
    if (page && page > 1) {
      url += "&paged=" + page;
    }
    return url;
  }

  function scoreEntry(entry, terms) {
    var title = (entry.title || "").toLowerCase();
    var excerpt = (entry.excerpt || "").toLowerCase();
    var text = (entry.text || "").toLowerCase();
    var score = 0;

    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      var inTitle = title.indexOf(term) !== -1;
      var inExcerpt = excerpt.indexOf(term) !== -1;
      var inText = text.indexOf(term) !== -1;
      if (!inTitle && !inExcerpt && !inText) {
        return -1;
      }
      if (inTitle) {
        score += 100;
      }
      if (inExcerpt) {
        score += 30;
      }
      if (inText) {
        score += 10;
      }
    }
    if (entry.type === "post") {
      score += 5;
    }
    return score;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function excerptAroundTerms(entry, terms) {
    var source = entry.excerpt || entry.text || "";
    if (!source) {
      return "";
    }
    var lower = source.toLowerCase();
    var idx = -1;
    for (var i = 0; i < terms.length; i++) {
      idx = lower.indexOf(terms[i]);
      if (idx !== -1) {
        break;
      }
    }
    if (idx === -1) {
      return source.length > 260 ? source.slice(0, 257) + "…" : source;
    }
    var start = Math.max(0, idx - 80);
    var snippet = source.slice(start, start + 260).trim();
    if (start > 0) {
      snippet = "…" + snippet;
    }
    if (start + 260 < source.length) {
      snippet += "…";
    }
    return snippet;
  }

  function renderArticle(entry, terms) {
    var url = pageUrl(entry.url);
    var title = escapeHtml(entry.title);
    var excerpt = escapeHtml(excerptAroundTerms(entry, terms));
    var html = '<article class="hentry post type-post status-publish format-standard" itemprop="blogPost" itemscope="" itemtype="http://schema.org/BlogPosting">';
    html += '<div class="article-inner">';
    html += '<header class="entry-header">';
    html += '<div class="entry-meta beforetitle-meta"></div>';
    html += '<h2 class="entry-title" itemprop="headline"><a href="' + url + '" itemprop="mainEntityOfPage" rel="bookmark">' + title + "</a></h2>";
    html += '<div class="entry-meta aftertitle-meta"></div>';
    html += "</header>";
    html += '<div class="entry-summary" itemprop="description"><p>' + excerpt + "</p></div>";
    html += '<div class="entry-meta entry-utility">';

    if (entry.author) {
      html += '<span class="author vcard" itemprop="author" itemscope="" itemtype="http://schema.org/Person">';
      html += '<i class="icon-author icon-metas" title="Author"></i> ';
      if (entry.author_url) {
        html +=
          '<a class="url fn n" href="' +
          pageUrl(entry.author_url) +
          '" itemprop="url" rel="author" title="View all posts by ' +
          escapeHtml(entry.author) +
          '"><em itemprop="name">' +
          escapeHtml(entry.author) +
          "</em></a>";
      } else {
        html += "<em itemprop=\"name\">" + escapeHtml(entry.author) + "</em>";
      }
      html += "</span> ";
    }

    if (entry.date) {
      html += '<span class="onDate date">';
      html += '<i class="icon-date icon-metas" title="Date"></i> ';
      html += '<time class="published" itemprop="datePublished">' + escapeHtml(entry.date) + "</time>";
      html += "</span> ";
    }

    if (entry.category) {
      html += '<span class="bl_categ">';
      html += '<i class="icon-category icon-metas" title="Categories"></i> ';
      if (entry.category_url) {
        html +=
          '<a href="' +
          pageUrl(entry.category_url) +
          '" rel="category tag">' +
          escapeHtml(entry.category) +
          "</a>";
      } else {
        html += escapeHtml(entry.category);
      }
      html += "</span>";
    }

    html += "</div>";
    html +=
      '<footer class="post-continue-container"><a class="continue-reading-link" href="' +
      url +
      '"><span>Continue reading</span><em class="screen-reader-text">"' +
      title +
      '"</em><i class="icon-continue-reading"></i></a></footer>';
    html += '<link href="' + url + '" itemprop="mainEntityOfPage"/>';
    html += "</div></article>";
    return html;
  }

  function renderPagination(query, page, totalPages) {
    if (totalPages <= 1) {
      return "";
    }
    var html = '<nav aria-label="Posts pagination" class="navigation pagination"><h2 class="screen-reader-text">Posts pagination</h2><div class="nav-links">';
    if (page > 1) {
      html +=
        '<a class="prev page-numbers" href="' +
        searchUrl(query, page - 1) +
        '"><i class="icon-pagination-left"></i></a>';
    }
    for (var p = 1; p <= totalPages; p++) {
      if (p === page) {
        html += '<span aria-current="page" class="page-numbers current">' + p + "</span>";
      } else {
        html += '<a class="page-numbers" href="' + searchUrl(query, p) + '">' + p + "</a>";
      }
    }
    if (page < totalPages) {
      html +=
        '<a class="next page-numbers" href="' +
        searchUrl(query, page + 1) +
        '"><i class="icon-pagination-right"></i></a>';
    }
    html += "</div></nav>";
    return html;
  }

  function renderResults(entries, query, page) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    var matches = entries
      .map(function (entry) {
        return { entry: entry, score: scoreEntry(entry, terms) };
      })
      .filter(function (item) {
        return item.score >= 0;
      })
      .sort(function (a, b) {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (b.entry.date || "").localeCompare(a.entry.date || "");
      });

    var total = matches.length;
    var start = (page - 1) * PER_PAGE;
    var pageItems = matches.slice(start, start + PER_PAGE);
    var html = "";

    if (!pageItems.length) {
      return {
        articles: '<p>No results for <strong>' + escapeHtml(query) + "</strong>.</p>",
        pagination: "",
      };
    }

    pageItems.forEach(function (item) {
      html += renderArticle(item.entry, terms);
    });

    return {
      articles: html,
      pagination: renderPagination(query, page, Math.ceil(total / PER_PAGE)),
    };
  }

  document.querySelectorAll("form.searchform").forEach(function (form) {
    form.setAttribute("action", searchPath);
    form.setAttribute("method", "get");
    form.setAttribute("role", "search");

    var field = form.querySelector('input[name="q"], input[name="s"], input[type="search"]');
    if (field) {
      field.setAttribute("name", "s");
    }

    form.addEventListener("submit", function (event) {
      var input = form.querySelector('input[name="s"], input[type="search"]');
      var query = input && input.value.trim();
      if (!query) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      window.location.href = searchUrl(query);
    });
  });

  var query = readQuery();
  if (isHomePage() && query) {
    window.location.replace(searchUrl(query, readPage()));
    return;
  }

  if (!isSearchPage()) {
    return;
  }

  var resultsRoot = document.getElementById("content-masonry");
  var paginationRoot = document.getElementById("site-search-pagination");
  var heading = document.getElementById("site-search-heading");
  var breadcrumb = document.getElementById("site-search-breadcrumb");

  if (query) {
    if (heading) {
      heading.innerHTML = 'Search Results for: <span>' + escapeHtml(query) + "</span>";
    }
    if (breadcrumb) {
      breadcrumb.textContent = 'Search results for "' + query + '"';
    }
    document.title = 'Search Results for "' + query + '" – Physical Activity Research Center';
    document.querySelectorAll('form.searchform input[name="s"], form.searchform input[type="search"]').forEach(function (input) {
      input.value = query;
    });
  }

  if (!query || !resultsRoot) {
    return;
  }

  resultsRoot.innerHTML = "<p>Searching…</p>";
  if (paginationRoot) {
    paginationRoot.innerHTML = "";
  }

  fetch(pageUrl("/search-index.json"))
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Search index not found");
      }
      return response.json();
    })
    .then(function (entries) {
      if (!Array.isArray(entries)) {
        throw new Error("Invalid search index");
      }
      var rendered = renderResults(entries, query, readPage());
      resultsRoot.innerHTML = rendered.articles;
      if (paginationRoot) {
        paginationRoot.innerHTML = rendered.pagination;
      }
    })
    .catch(function () {
      resultsRoot.innerHTML = "<p>Search is temporarily unavailable.</p>";
    });
})();
