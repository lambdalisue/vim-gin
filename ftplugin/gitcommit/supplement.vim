if get(g:, 'gin_gitcommit_supplement_disable', 0) || exists('b:loaded_gin_gitcommit_supplement')
  finish
endif
let b:loaded_gin_gitcommit_supplement = 1

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
    " Check if all supplements are opened
    if empty(filter(values(ctx.supplements), { _, v -> v }))
      call gin#window#supplement#close_all(ctx)
      botright split
      call gin#window#supplement#add(ctx, 'log')
      botright vsplit
      call gin#window#supplement#add(ctx, 'show')
      rightbelow 15split
      call gin#window#supplement#add(ctx, 'stat')
    endif
    " Update supplement contents
    silent! call win_execute(
          \ ctx.supplements.log,
          \ 'Gin! ++buffer log --graph --decorate --oneline',
          \)
    silent! call win_execute(
          \ ctx.supplements.show,
          \ 'Gin! ++buffer diff --cached',
          \)
    silent! call win_execute(
          \ ctx.supplements.stat,
          \ 'Gin! ++buffer diff --stat --cached',
          \)
  finally
    call win_gotoid(winid_saved)
  endtry
endfunction

call gin#window#supplement#init()
call s:open()
