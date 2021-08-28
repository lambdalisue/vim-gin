if exists('g:loaded_gin_colors')
  finish
endif
let g:loaded_gin_colors = 1

" Ref: https://github.com/w0ng/vim-hybrid
function! s:define_highlight() abort
  highlight default GinColor0  ctermfg=0  guifg=#282A2E
  highlight default GinColor1  ctermfg=1  guifg=#A54242
  highlight default GinColor2  ctermfg=2  guifg=#8C9440
  highlight default GinColor3  ctermfg=3  guifg=#DE935F
  highlight default GinColor4  ctermfg=4  guifg=#5F819D
  highlight default GinColor5  ctermfg=5  guifg=#85678F
  highlight default GinColor6  ctermfg=6  guifg=#5E8D87
  highlight default GinColor7  ctermfg=7  guifg=#707880
  highlight default GinColor8  ctermfg=8  guifg=#373B41
  highlight default GinColor9  ctermfg=9  guifg=#CC6666
  highlight default GinColor10 ctermfg=10 guifg=#B5BD68
  highlight default GinColor11 ctermfg=11 guifg=#F0C674
  highlight default GinColor12 ctermfg=12 guifg=#81A2BE
  highlight default GinColor13 ctermfg=13 guifg=#B294BB
  highlight default GinColor14 ctermfg=14 guifg=#8ABEB7
  highlight default GinColor15 ctermfg=15 guifg=#C5C8C6
endfunction

augroup gin_plugin_colors_define_highlight_internal
  autocmd! *
  autocmd ColorScheme * call s:define_highlight()
augroup END

call s:define_highlight()
