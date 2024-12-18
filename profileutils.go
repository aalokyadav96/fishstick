package main

import "github.com/disintegration/imaging"

// createThumbnail creates a thumbnail of the image at inputPath and saves it at outputPath.
func createThumbnail(inputPath, outputPath string) error {
	width := 100
	height := 100

	img, err := imaging.Open(inputPath)
	if err != nil {
		return err
	}
	resizedImg := imaging.Resize(img, width, height, imaging.Lanczos)
	return imaging.Save(resizedImg, outputPath)
}
