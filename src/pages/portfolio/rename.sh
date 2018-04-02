for file in *.hbs; do
    mv "$file" "$(basename "$file" .hbs).ejs"
done
