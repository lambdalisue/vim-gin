" Default prefix sets for diff fold text
" ASCII version (default)
const g:gin#difffold#prefixes_ascii = {
      \ 'added': '[+]',
      \ 'deleted': '[-]',
      \ 'modified': '[.]',
      \ 'renamed': '[/]',
      \ }

" Nerd Font version (using Codicons nf-cod-diff_*)
const g:gin#difffold#prefixes_nerdfont = {
      \ 'added': ' ',
      \ 'deleted': ' ',
      \ 'modified': ' ',
      \ 'renamed': ' ',
      \ }

" Get foldtext for diff buffer
" Detects file status (added/deleted/modified/renamed) and displays it
function! gin#difffold#foldtext() abort
  " Parse file paths from first two lines
  let l:old_line = getline(v:foldstart)
  let l:new_line = getline(v:foldstart + 1)

  " Extract paths (--- a/path or +++ b/path)
  let l:old_path = matchstr(l:old_line, '^--- \zs.\{-}\ze\%(\t\|$\)')
  let l:new_path = matchstr(l:new_line, '^+++ \zs.\{-}\ze\%(\t\|$\)')

  " Remove a/ and b/ prefixes
  let l:old_normalized = substitute(l:old_path, '^a/', '', '')
  let l:new_normalized = substitute(l:new_path, '^b/', '', '')

  " Determine file status and build display
  if l:old_path ==# '/dev/null'
    let l:prefix = 'added'
    let l:path = l:new_normalized
  elseif l:new_path ==# '/dev/null'
    let l:prefix = 'deleted'
    let l:path = l:old_normalized
  elseif l:old_normalized !=# l:new_normalized
    let l:prefix = 'renamed'
    let l:path = l:old_normalized . ' -> ' . l:new_normalized
  else
    let l:prefix = 'modified'
    let l:path = l:new_normalized
  endif

  " Count diff lines (skip first 2 header lines)
  let l:added = 0
  let l:deleted = 0

  for l:i in range(v:foldstart + 2, v:foldend)
    let l:line = getline(l:i)
    let l:first = l:line[0]
    if l:first ==# '+'
      let l:added += 1
    elseif l:first ==# '-'
      let l:deleted += 1
    endif
  endfor

  " Get prefix symbol from config
  let l:prefixes = extend(
        \ copy(g:gin#difffold#prefixes_ascii),
        \ get(g:, 'gin_difffold_prefixes', {})
        \ )

  " Build stats string
  let l:stats = []
  if l:added > 0
    call add(l:stats, '+' . l:added)
  endif
  if l:deleted > 0
    call add(l:stats, '-' . l:deleted)
  endif

  return l:prefixes[l:prefix] . ' ' . l:path . ' (' . join(l:stats, ' ') . ')'
endfunction
