if get(g:, 'gin_gitrebase_supplement_disable', 0) || exists('b:loaded_gin_gitrebase_supplement')
  finish
endif
let b:loaded_gin_gitrebase_supplement = 1

let s:COMMANDS = [
      \ 'p', 'pick',
      \ 'r', 'reword',
      \ 'e', 'edit',
      \ 's', 'squash',
      \ 'f', 'fixup',
      \ 'x', 'exec',
      \ 'd', 'drop',
      \]

function! s:find_value() abort
  let line = getline('.')
  let pattern = printf('^\%%(%s\) \zs[0-9a-fA-F]\+', join(s:COMMANDS, '\|'))
  return matchstr(line, pattern)
endfunction

function! s:open() abort
  if mode() !=# 'n'
    return
  endif
  let winid = win_getid()
  call denops#plugin#wait_async('gin', { -> s:open_internal(winid) })
endfunction

function! s:open_internal(winid) abort
  let ctx = gin#window#supplement#ctx(a:winid)
  if ctx is# v:null
    return
  endif
  let winid_saved = win_getid()
  try
    call win_gotoid(a:winid)
    let value = s:find_value()
    if value ==# get(t:, 'gin_gitrebase_supplement_previous', '')
      return
    endif
    let t:gin_gitrebase_supplement_previous = value
    if value ==# ''
      call gin#window#supplement#close_all(ctx)
    else
      " Check if all supplements are opened
      if empty(filter(values(ctx.supplements), { _, v -> v }))
        call gin#window#supplement#close_all(ctx)
        botright vsplit
        call gin#window#supplement#add(ctx, 'show')
        rightbelow 15split
        call gin#window#supplement#add(ctx, 'stat')
      endif
      " Update supplement contents
      silent! call win_execute(
            \ ctx.supplements.show,
            \ printf('Gin! ++buffer show --pretty=fuller %s', value),
            \)
      silent! call win_execute(
            \ ctx.supplements.stat,
            \ printf('Gin! ++buffer diff --stat %s', value),
            \)
    endif
  finally
    call win_gotoid(winid_saved)
  endtry
endfunction

augroup gin_gitrebase_supplement_internal
  autocmd! * <buffer>
  autocmd CursorMoved,CursorHold <buffer> call s:open()
augroup END

call gin#window#supplement#init()
call s:open()
