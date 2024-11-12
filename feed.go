package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func getFeed(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tmpl.ExecuteTemplate(w, "index.html", nil)
}

func createPost(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tmpl.ExecuteTemplate(w, "index.html", nil)
}
